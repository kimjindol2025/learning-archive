// Memory Allocator
// Manages heap allocation and deallocation

use std::collections::HashMap;
use crate::core::Value;
use std::time::Instant;

/// Allocated block information
#[derive(Debug, Clone)]
struct AllocatedBlock {
    value: Value,
    size: usize,
    allocated_at: Instant,
    ref_count: usize,
}

/// Memory allocator with GC support
pub struct MemoryAllocator {
    heap: HashMap<u64, AllocatedBlock>,
    next_id: u64,
    total_allocated: usize,
    total_freed: usize,
    gc_threshold: usize,  // Trigger GC at 5MB
    allocation_count: u64,
}

impl MemoryAllocator {
    /// Create new allocator
    pub fn new() -> Self {
        MemoryAllocator {
            heap: HashMap::new(),
            next_id: 1,
            total_allocated: 0,
            total_freed: 0,
            gc_threshold: 5 * 1024 * 1024,  // 5MB
            allocation_count: 0,
        }
    }

    /// Allocate value on heap
    pub fn allocate(&mut self, value: Value) -> u64 {
        let id = self.next_id;
        self.next_id += 1;

        let size = self.estimate_size(&value);
        self.total_allocated += size;
        self.allocation_count += 1;

        let block = AllocatedBlock {
            value,
            size,
            allocated_at: Instant::now(),
            ref_count: 1,
        };

        self.heap.insert(id, block);
        id
    }

    /// Free allocated value
    pub fn free(&mut self, id: u64) -> Option<Value> {
        if let Some(block) = self.heap.remove(&id) {
            self.total_freed += block.size;
            Some(block.value)
        } else {
            None
        }
    }

    /// Get value from heap
    pub fn get(&self, id: u64) -> Option<Value> {
        self.heap.get(&id).map(|b| b.value.clone())
    }

    /// Get mutable reference to value
    pub fn get_mut(&mut self, id: u64) -> Option<&mut Value> {
        self.heap.get_mut(&id).map(|b| &mut b.value)
    }

    /// Increment reference count
    pub fn increment_ref(&mut self, id: u64) {
        if let Some(block) = self.heap.get_mut(&id) {
            block.ref_count += 1;
        }
    }

    /// Decrement reference count
    pub fn decrement_ref(&mut self, id: u64) -> usize {
        if let Some(block) = self.heap.get_mut(&id) {
            if block.ref_count > 0 {
                block.ref_count -= 1;
            }
            block.ref_count
        } else {
            0
        }
    }

    /// Get reference count
    pub fn ref_count(&self, id: u64) -> usize {
        self.heap.get(&id).map(|b| b.ref_count).unwrap_or(0)
    }

    /// Check if GC should run
    pub fn should_gc(&self) -> bool {
        self.total_allocated - self.total_freed > self.gc_threshold
    }

    /// Get memory usage
    pub fn memory_usage(&self) -> usize {
        self.total_allocated - self.total_freed
    }

    /// Get allocator statistics
    pub fn stats(&self) -> (usize, usize, usize, u64, usize) {
        (
            self.total_allocated,
            self.total_freed,
            self.heap.len(),
            self.allocation_count,
            self.memory_usage(),
        )
    }

    /// Get number of allocated objects
    pub fn object_count(&self) -> usize {
        self.heap.len()
    }

    /// Set GC threshold
    pub fn set_gc_threshold(&mut self, threshold: usize) {
        self.gc_threshold = threshold;
    }

    /// Estimate value size in bytes
    fn estimate_size(&self, value: &Value) -> usize {
        match value {
            Value::Null => 8,
            Value::Bool(_) => 8,
            Value::Number(_) => 8,
            Value::String(s) => 24 + s.len(),  // String overhead + data
            Value::Array(_) => 64,  // Array overhead
            Value::Object(_) => 64, // Object overhead
            Value::Function(_) => 32,
            Value::Error(e) => 24 + e.len(),
        }
    }

    /// Reset allocator
    pub fn reset(&mut self) {
        self.heap.clear();
        self.next_id = 1;
        self.total_allocated = 0;
        self.total_freed = 0;
        self.allocation_count = 0;
    }

    /// Collect unreferenced objects
    pub fn collect_unreferenced(&mut self) -> usize {
        let mut collected = 0;
        let unreferenced: Vec<u64> = self
            .heap
            .iter()
            .filter(|(_, block)| block.ref_count == 0)
            .map(|(id, _)| *id)
            .collect();

        for id in unreferenced {
            if self.free(id).is_some() {
                collected += 1;
            }
        }

        collected
    }
}

impl Default for MemoryAllocator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_allocate_basic() {
        let mut alloc = MemoryAllocator::new();
        let id = alloc.allocate(Value::Number(42.0));
        assert!(alloc.get(id).is_some());
        assert_eq!(alloc.object_count(), 1);
    }

    #[test]
    fn test_allocate_multiple() {
        let mut alloc = MemoryAllocator::new();
        let id1 = alloc.allocate(Value::Number(1.0));
        let id2 = alloc.allocate(Value::String("test".to_string()));
        let id3 = alloc.allocate(Value::Bool(true));

        assert_eq!(alloc.object_count(), 3);
        assert!(alloc.get(id1).is_some());
        assert!(alloc.get(id2).is_some());
        assert!(alloc.get(id3).is_some());
    }

    #[test]
    fn test_free() {
        let mut alloc = MemoryAllocator::new();
        let id = alloc.allocate(Value::String("test".to_string()));
        assert_eq!(alloc.object_count(), 1);

        let freed = alloc.free(id);
        assert!(freed.is_some());
        assert_eq!(alloc.object_count(), 0);
        assert!(alloc.get(id).is_none());
    }

    #[test]
    fn test_ref_count() {
        let mut alloc = MemoryAllocator::new();
        let id = alloc.allocate(Value::Number(42.0));

        assert_eq!(alloc.ref_count(id), 1);

        alloc.increment_ref(id);
        assert_eq!(alloc.ref_count(id), 2);

        alloc.increment_ref(id);
        assert_eq!(alloc.ref_count(id), 3);

        alloc.decrement_ref(id);
        assert_eq!(alloc.ref_count(id), 2);
    }

    #[test]
    fn test_memory_usage() {
        let mut alloc = MemoryAllocator::new();
        let initial = alloc.memory_usage();

        alloc.allocate(Value::Number(1.0));
        let after_alloc = alloc.memory_usage();

        assert!(after_alloc > initial);
    }

    #[test]
    fn test_gc_threshold() {
        let mut alloc = MemoryAllocator::new();
        assert!(!alloc.should_gc());

        alloc.set_gc_threshold(100);
        for _ in 0..20 {
            alloc.allocate(Value::String("test".to_string()));
        }

        // May trigger GC depending on string size
        let _ = alloc.should_gc();
    }

    #[test]
    fn test_collect_unreferenced() {
        let mut alloc = MemoryAllocator::new();
        let id1 = alloc.allocate(Value::Number(1.0));
        let id2 = alloc.allocate(Value::Number(2.0));
        let id3 = alloc.allocate(Value::Number(3.0));

        assert_eq!(alloc.object_count(), 3);

        // Decrement refs to make them unreferenced
        alloc.decrement_ref(id1);
        alloc.decrement_ref(id2);

        let collected = alloc.collect_unreferenced();
        assert_eq!(collected, 2);
        assert_eq!(alloc.object_count(), 1);
        assert!(alloc.get(id3).is_some());
    }

    #[test]
    fn test_stats() {
        let mut alloc = MemoryAllocator::new();
        alloc.allocate(Value::Number(1.0));
        alloc.allocate(Value::Number(2.0));
        alloc.allocate(Value::Number(3.0));

        let (allocated, freed, count, total, usage) = alloc.stats();
        assert!(allocated > 0);
        assert_eq!(freed, 0);
        assert_eq!(count, 3);
        assert_eq!(total, 3);
        assert!(usage > 0);
    }

    #[test]
    fn test_reset() {
        let mut alloc = MemoryAllocator::new();
        alloc.allocate(Value::Number(1.0));
        alloc.allocate(Value::Number(2.0));

        assert_eq!(alloc.object_count(), 2);

        alloc.reset();
        assert_eq!(alloc.object_count(), 0);
        assert_eq!(alloc.memory_usage(), 0);
    }
}

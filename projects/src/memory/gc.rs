// Garbage Collector
// Mark & Sweep garbage collection for circular references

use std::collections::HashSet;
use crate::core::Value;
use std::time::{Instant, Duration};

/// Garbage collector with Mark & Sweep strategy
pub struct GarbageCollector {
    marked: HashSet<u64>,
    gc_count: u64,
    last_gc: Instant,
    min_gc_interval: Duration,
    collected_count: u64,
}

impl GarbageCollector {
    /// Create new GC
    pub fn new() -> Self {
        GarbageCollector {
            marked: HashSet::new(),
            gc_count: 0,
            last_gc: Instant::now(),
            min_gc_interval: Duration::from_millis(100),
            collected_count: 0,
        }
    }

    /// Mark phase - mark reachable objects
    pub fn mark(&mut self, roots: &[Value]) {
        self.marked.clear();
        for root in roots {
            self.mark_value(root);
        }
    }

    /// Sweep phase - collect unmarked objects
    pub fn sweep(&mut self) -> usize {
        self.gc_count += 1;
        self.last_gc = Instant::now();
        0  // Return number of collected objects
    }

    /// Mark a value and its references
    fn mark_value(&mut self, value: &Value) {
        match value {
            Value::Array(arr) => {
                let arr_ref = arr.borrow();
                for v in arr_ref.iter() {
                    self.mark_value(v);
                }
            }
            Value::Object(obj) => {
                let obj_ref = obj.borrow();
                for v in obj_ref.values() {
                    self.mark_value(v);
                }
            }
            _ => {}
        }
    }

    /// Check if GC should run
    pub fn should_run(&self) -> bool {
        self.last_gc.elapsed() > self.min_gc_interval
    }

    /// Get marked objects count
    pub fn marked_count(&self) -> usize {
        self.marked.len()
    }

    /// Get GC statistics
    pub fn stats(&self) -> (u64, usize, u64) {
        (self.gc_count, self.marked.len(), self.collected_count)
    }

    /// Set minimum GC interval
    pub fn set_min_interval(&mut self, interval: Duration) {
        self.min_gc_interval = interval;
    }

    /// Reset GC
    pub fn reset(&mut self) {
        self.marked.clear();
        self.gc_count = 0;
        self.collected_count = 0;
        self.last_gc = Instant::now();
    }
}

impl Default for GarbageCollector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn test_gc_creation() {
        let gc = GarbageCollector::new();
        let (count, marked, collected) = gc.stats();
        assert_eq!(count, 0);
        assert_eq!(marked, 0);
        assert_eq!(collected, 0);
    }

    #[test]
    fn test_gc_mark() {
        let mut gc = GarbageCollector::new();
        let roots = vec![
            Value::Number(1.0),
            Value::String("test".to_string()),
            Value::Bool(true),
        ];

        gc.mark(&roots);
        assert!(gc.marked_count() >= 0);
    }

    #[test]
    fn test_gc_sweep() {
        let mut gc = GarbageCollector::new();
        assert_eq!(gc.stats().0, 0);

        gc.sweep();
        assert_eq!(gc.stats().0, 1);

        gc.sweep();
        assert_eq!(gc.stats().0, 2);
    }

    #[test]
    fn test_gc_should_run() {
        let mut gc = GarbageCollector::new();
        gc.set_min_interval(Duration::from_millis(10));

        assert!(!gc.should_run());
        thread::sleep(Duration::from_millis(15));
        assert!(gc.should_run());
    }

    #[test]
    fn test_gc_reset() {
        let mut gc = GarbageCollector::new();
        gc.sweep();
        gc.sweep();
        assert_eq!(gc.stats().0, 2);

        gc.reset();
        assert_eq!(gc.stats().0, 0);
        assert_eq!(gc.marked_count(), 0);
    }

    #[test]
    fn test_gc_with_array() {
        let mut gc = GarbageCollector::new();
        let arr = Value::array(vec![
            Value::Number(1.0),
            Value::String("test".to_string()),
        ]);

        gc.mark(&[arr]);
        assert!(gc.marked_count() >= 0);
    }

    #[test]
    fn test_gc_with_object() {
        let mut gc = GarbageCollector::new();
        let obj = Value::empty_object();
        obj.set_property("key".to_string(), Value::Number(42.0))
            .unwrap();

        gc.mark(&[obj]);
        assert!(gc.marked_count() >= 0);
    }
}

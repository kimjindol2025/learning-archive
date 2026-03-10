// Runtime Virtual Machine
// Main execution engine

use crate::core::Value;
use crate::memory::{MemoryAllocator, GarbageCollector, ReferenceCounter};
use crate::runtime::context::ExecutionContext;

/// FreeLang runtime engine
pub struct RuntimeEngine {
    memory: MemoryAllocator,
    gc: GarbageCollector,
    refcount: ReferenceCounter,
    context: ExecutionContext,
}

impl RuntimeEngine {
    /// Create new runtime
    pub fn new() -> Self {
        println!("🔧 Initializing runtime engine...");

        RuntimeEngine {
            memory: MemoryAllocator::new(),
            gc: GarbageCollector::new(),
            refcount: ReferenceCounter::new(),
            context: ExecutionContext::new(),
        }
    }

    /// Execute a value
    pub fn execute(&mut self, value: Value) -> Result<Value, String> {
        // Check if GC should run
        if self.memory.should_gc() {
            self.run_gc();
        }

        Ok(value)
    }

    /// Run garbage collection
    fn run_gc(&mut self) {
        // Mark phase
        self.gc.mark(&[]);

        // Sweep phase
        self.gc.sweep();
    }

    /// Get memory statistics
    pub fn memory_stats(&self) -> usize {
        self.memory.memory_usage()
    }
}

impl Default for RuntimeEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runtime_creation() {
        let engine = RuntimeEngine::new();
        assert_eq!(engine.memory_stats(), 0);
    }

    #[test]
    fn test_execute() {
        let mut engine = RuntimeEngine::new();
        let result = engine.execute(Value::Number(42.0));
        assert!(result.is_ok());
    }
}

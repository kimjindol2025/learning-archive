// Memory Management Module
// Handles allocation, reference counting, and garbage collection

pub mod allocator;
pub mod gc;
pub mod refcount;

pub use allocator::MemoryAllocator;
pub use gc::GarbageCollector;
pub use refcount::ReferenceCounter;

/// Memory management statistics
#[derive(Clone, Debug)]
pub struct MemoryStats {
    pub allocated: usize,
    pub freed: usize,
    pub active: usize,
    pub gc_runs: u64,
    pub gc_collected: usize,
}

impl MemoryStats {
    pub fn new() -> Self {
        MemoryStats {
            allocated: 0,
            freed: 0,
            active: 0,
            gc_runs: 0,
            gc_collected: 0,
        }
    }
}

// Reference Counting
// Automatic reference counting for immediate memory cleanup

use std::collections::HashMap;

/// Reference counter statistics
#[derive(Clone, Debug)]
pub struct RefCountStats {
    pub total_increments: u64,
    pub total_decrements: u64,
    pub objects_tracked: usize,
    pub unreferenced_count: usize,
}

/// Reference counter with statistics
pub struct ReferenceCounter {
    counts: HashMap<u64, usize>,
    total_increments: u64,
    total_decrements: u64,
}

impl ReferenceCounter {
    /// Create new reference counter
    pub fn new() -> Self {
        ReferenceCounter {
            counts: HashMap::new(),
            total_increments: 0,
            total_decrements: 0,
        }
    }

    /// Increment reference count
    pub fn increment(&mut self, id: u64) {
        *self.counts.entry(id).or_insert(0) += 1;
        self.total_increments += 1;
    }

    /// Increment by amount
    pub fn increment_by(&mut self, id: u64, amount: usize) {
        *self.counts.entry(id).or_insert(0) += amount;
        self.total_increments += amount as u64;
    }

    /// Decrement reference count
    pub fn decrement(&mut self, id: u64) -> usize {
        let count = self.counts.entry(id).or_insert(0);
        if *count > 0 {
            *count -= 1;
            self.total_decrements += 1;
        }
        *count
    }

    /// Decrement by amount
    pub fn decrement_by(&mut self, id: u64, amount: usize) -> usize {
        let count = self.counts.entry(id).or_insert(0);
        let decrement = std::cmp::min(*count, amount);
        *count -= decrement;
        self.total_decrements += decrement as u64;
        *count
    }

    /// Get reference count
    pub fn count(&self, id: u64) -> usize {
        self.counts.get(&id).copied().unwrap_or(0)
    }

    /// Check if no references
    pub fn is_unreferenced(&self, id: u64) -> bool {
        self.count(id) == 0
    }

    /// Remove reference count
    pub fn remove(&mut self, id: u64) -> bool {
        self.counts.remove(&id).is_some()
    }

    /// Get all unreferenced IDs
    pub fn get_unreferenced(&self) -> Vec<u64> {
        self.counts
            .iter()
            .filter(|(_, &count)| count == 0)
            .map(|(id, _)| *id)
            .collect()
    }

    /// Get statistics
    pub fn stats(&self) -> RefCountStats {
        let unreferenced_count = self.get_unreferenced().len();
        RefCountStats {
            total_increments: self.total_increments,
            total_decrements: self.total_decrements,
            objects_tracked: self.counts.len(),
            unreferenced_count,
        }
    }

    /// Clear all reference counts
    pub fn clear(&mut self) {
        self.counts.clear();
        self.total_increments = 0;
        self.total_decrements = 0;
    }

    /// Get number of tracked objects
    pub fn tracked_count(&self) -> usize {
        self.counts.len()
    }
}

impl Default for ReferenceCounter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_refcount_basic() {
        let mut rc = ReferenceCounter::new();
        rc.increment(1);
        assert_eq!(rc.count(1), 1);
        rc.increment(1);
        assert_eq!(rc.count(1), 2);
        rc.decrement(1);
        assert_eq!(rc.count(1), 1);
    }

    #[test]
    fn test_refcount_multiple_ids() {
        let mut rc = ReferenceCounter::new();
        rc.increment(1);
        rc.increment(2);
        rc.increment(3);

        assert_eq!(rc.count(1), 1);
        assert_eq!(rc.count(2), 1);
        assert_eq!(rc.count(3), 1);
        assert_eq!(rc.tracked_count(), 3);
    }

    #[test]
    fn test_is_unreferenced() {
        let mut rc = ReferenceCounter::new();
        rc.increment(1);
        assert!(!rc.is_unreferenced(1));

        rc.decrement(1);
        assert!(rc.is_unreferenced(1));
    }

    #[test]
    fn test_increment_by() {
        let mut rc = ReferenceCounter::new();
        rc.increment_by(1, 5);
        assert_eq!(rc.count(1), 5);

        rc.increment_by(1, 3);
        assert_eq!(rc.count(1), 8);
    }

    #[test]
    fn test_decrement_by() {
        let mut rc = ReferenceCounter::new();
        rc.increment_by(1, 10);
        assert_eq!(rc.count(1), 10);

        rc.decrement_by(1, 3);
        assert_eq!(rc.count(1), 7);

        rc.decrement_by(1, 10);  // Try to decrement more than available
        assert_eq!(rc.count(1), 0);
    }

    #[test]
    fn test_get_unreferenced() {
        let mut rc = ReferenceCounter::new();
        rc.increment(1);
        rc.increment(2);
        rc.increment(3);

        rc.decrement(1);  // Now has 0 refs
        rc.decrement(2);  // Now has 0 refs

        let unreferenced = rc.get_unreferenced();
        assert_eq!(unreferenced.len(), 2);
        assert!(unreferenced.contains(&1));
        assert!(unreferenced.contains(&2));
    }

    #[test]
    fn test_stats() {
        let mut rc = ReferenceCounter::new();
        rc.increment(1);
        rc.increment(1);
        rc.decrement(1);

        let stats = rc.stats();
        assert_eq!(stats.total_increments, 2);
        assert_eq!(stats.total_decrements, 1);
        assert_eq!(stats.objects_tracked, 1);
    }

    #[test]
    fn test_remove() {
        let mut rc = ReferenceCounter::new();
        rc.increment(1);
        assert_eq!(rc.tracked_count(), 1);

        rc.remove(1);
        assert_eq!(rc.tracked_count(), 0);
        assert_eq!(rc.count(1), 0);
    }

    #[test]
    fn test_clear() {
        let mut rc = ReferenceCounter::new();
        rc.increment(1);
        rc.increment(2);
        rc.increment(3);

        assert_eq!(rc.tracked_count(), 3);

        rc.clear();
        assert_eq!(rc.tracked_count(), 0);
    }
}

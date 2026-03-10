// Object Type
// Represents FreeLang objects with fields and methods

use std::collections::HashMap;
use std::time::Instant;
use crate::core::Value;

/// FreeLang Object representation
#[derive(Clone)]
pub struct Object {
    pub id: u64,
    pub class: String,
    pub fields: HashMap<String, Value>,
    pub created_at: Instant,
    pub last_accessed: Instant,
}

impl Object {
    /// Create new object with class name
    pub fn new(class: String) -> Self {
        let now = Instant::now();
        Object {
            id: Self::generate_id(),
            class,
            fields: HashMap::new(),
            created_at: now,
            last_accessed: now,
        }
    }

    /// Set field value
    pub fn set_field(&mut self, name: String, value: Value) {
        self.last_accessed = Instant::now();
        self.fields.insert(name, value);
    }

    /// Get field value
    pub fn get_field(&self, name: &str) -> Option<Value> {
        self.fields.get(name).cloned()
    }

    /// Check if field exists
    pub fn has_field(&self, name: &str) -> bool {
        self.fields.contains_key(name)
    }

    /// Get all field names
    pub fn field_names(&self) -> Vec<String> {
        self.fields.keys().cloned().collect()
    }

    /// Generate unique ID
    fn generate_id() -> u64 {
        use std::sync::atomic::{AtomicU64, Ordering};
        static COUNTER: AtomicU64 = AtomicU64::new(1);
        COUNTER.fetch_add(1, Ordering::Relaxed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_object_creation() {
        let obj = Object::new("TestClass".to_string());
        assert_eq!(obj.class, "TestClass");
        assert!(obj.fields.is_empty());
    }

    #[test]
    fn test_set_get_field() {
        let mut obj = Object::new("TestClass".to_string());
        obj.set_field("name".to_string(), Value::String("test".to_string()));

        let value = obj.get_field("name");
        assert!(value.is_some());
    }
}

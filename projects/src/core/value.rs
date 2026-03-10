// Value Type System
// Represents all possible values in FreeLang runtime

use std::collections::HashMap;
use std::rc::Rc;
use std::cell::RefCell;
use std::fmt;

/// Main Value type - represents all FreeLang values
#[derive(Clone)]
pub enum Value {
    /// Null value
    Null,

    /// Boolean (true/false)
    Bool(bool),

    /// Number (f64 - supports both integers and floats)
    Number(f64),

    /// String (immutable UTF-8)
    String(String),

    /// Array (mutable, reference-counted)
    Array(Rc<RefCell<Vec<Value>>>),

    /// Object (mutable HashMap, reference-counted)
    Object(Rc<RefCell<HashMap<String, Value>>>),

    /// Function (callable)
    Function(Rc<Box<dyn Fn(Vec<Value>) -> Result<Value, String>>>),

    /// Error value
    Error(String),
}

impl PartialEq for Value {
    fn eq(&self, other: &Self) -> bool {
        self.equals(other)
    }
}

impl Value {
    /// Get type name as string
    pub fn type_of(&self) -> &str {
        match self {
            Value::Null => "null",
            Value::Bool(_) => "boolean",
            Value::Number(_) => "number",
            Value::String(_) => "string",
            Value::Array(_) => "array",
            Value::Object(_) => "object",
            Value::Function(_) => "function",
            Value::Error(_) => "error",
        }
    }

    /// Check if value is truthy
    pub fn is_truthy(&self) -> bool {
        match self {
            Value::Null => false,
            Value::Bool(b) => *b,
            Value::Number(n) => *n != 0.0 && !n.is_nan(),
            Value::String(s) => !s.is_empty(),
            Value::Array(_) => true,
            Value::Object(_) => true,
            Value::Function(_) => true,
            Value::Error(_) => false,
        }
    }

    /// Convert to number
    pub fn to_number(&self) -> f64 {
        match self {
            Value::Null => 0.0,
            Value::Bool(b) => if *b { 1.0 } else { 0.0 },
            Value::Number(n) => *n,
            Value::String(s) => s.parse().unwrap_or(0.0),
            Value::Array(_) => f64::NAN,
            Value::Object(_) => f64::NAN,
            Value::Function(_) => f64::NAN,
            Value::Error(_) => f64::NAN,
        }
    }

    /// Convert to string
    pub fn to_string(&self) -> String {
        match self {
            Value::Null => "null".to_string(),
            Value::Bool(b) => b.to_string(),
            Value::Number(n) => {
                if n.fract() == 0.0 && !n.is_infinite() {
                    format!("{:.0}", n)
                } else {
                    n.to_string()
                }
            }
            Value::String(s) => s.clone(),
            Value::Array(arr) => {
                let arr_ref = arr.borrow();
                let elements: Vec<String> = arr_ref
                    .iter()
                    .map(|v| v.to_string())
                    .collect();
                format!("[{}]", elements.join(", "))
            }
            Value::Object(obj) => {
                let obj_ref = obj.borrow();
                let entries: Vec<String> = obj_ref
                    .iter()
                    .map(|(k, v)| format!("{}: {}", k, v.to_string()))
                    .collect();
                format!("{{{}}}", entries.join(", "))
            }
            Value::Function(_) => "[Function]".to_string(),
            Value::Error(e) => format!("Error: {}", e),
        }
    }

    /// Check equality
    pub fn equals(&self, other: &Value) -> bool {
        match (self, other) {
            (Value::Null, Value::Null) => true,
            (Value::Bool(a), Value::Bool(b)) => a == b,
            (Value::Number(a), Value::Number(b)) => a == b,
            (Value::String(a), Value::String(b)) => a == b,
            (Value::Array(a), Value::Array(b)) => {
                Rc::ptr_eq(a, b) || {
                    let a_ref = a.borrow();
                    let b_ref = b.borrow();
                    a_ref.len() == b_ref.len()
                        && a_ref
                            .iter()
                            .zip(b_ref.iter())
                            .all(|(x, y)| x.equals(y))
                }
            }
            (Value::Object(a), Value::Object(b)) => Rc::ptr_eq(a, b),
            _ => false,
        }
    }

    /// Create array from vec
    pub fn array(values: Vec<Value>) -> Self {
        Value::Array(Rc::new(RefCell::new(values)))
    }

    /// Create object from HashMap
    pub fn object(map: HashMap<String, Value>) -> Self {
        Value::Object(Rc::new(RefCell::new(map)))
    }

    /// Create empty object
    pub fn empty_object() -> Self {
        Value::Object(Rc::new(RefCell::new(HashMap::new())))
    }

    /// Create empty array
    pub fn empty_array() -> Self {
        Value::Array(Rc::new(RefCell::new(Vec::new())))
    }

    /// Check if value is a number
    pub fn is_number(&self) -> bool {
        matches!(self, Value::Number(_))
    }

    /// Check if value is a string
    pub fn is_string(&self) -> bool {
        matches!(self, Value::String(_))
    }

    /// Check if value is an array
    pub fn is_array(&self) -> bool {
        matches!(self, Value::Array(_))
    }

    /// Check if value is an object
    pub fn is_object(&self) -> bool {
        matches!(self, Value::Object(_))
    }

    /// Check if value is a function
    pub fn is_function(&self) -> bool {
        matches!(self, Value::Function(_))
    }

    /// Check if value is an error
    pub fn is_error(&self) -> bool {
        matches!(self, Value::Error(_))
    }

    /// Check if value is null
    pub fn is_null(&self) -> bool {
        matches!(self, Value::Null)
    }

    /// Check if value is a boolean
    pub fn is_bool(&self) -> bool {
        matches!(self, Value::Bool(_))
    }

    /// Get array length (returns 0 if not array)
    pub fn array_len(&self) -> usize {
        match self {
            Value::Array(arr) => arr.borrow().len(),
            _ => 0,
        }
    }

    /// Get object keys (returns empty vec if not object)
    pub fn object_keys(&self) -> Vec<String> {
        match self {
            Value::Object(obj) => obj.borrow().keys().cloned().collect(),
            _ => Vec::new(),
        }
    }

    /// Add to array
    pub fn array_push(&self, value: Value) -> Result<(), String> {
        match self {
            Value::Array(arr) => {
                arr.borrow_mut().push(value);
                Ok(())
            }
            _ => Err("Cannot push to non-array".to_string()),
        }
    }

    /// Pop from array
    pub fn array_pop(&self) -> Result<Option<Value>, String> {
        match self {
            Value::Array(arr) => Ok(arr.borrow_mut().pop()),
            _ => Err("Cannot pop from non-array".to_string()),
        }
    }

    /// Set object property
    pub fn set_property(&self, key: String, value: Value) -> Result<(), String> {
        match self {
            Value::Object(obj) => {
                obj.borrow_mut().insert(key, value);
                Ok(())
            }
            _ => Err("Cannot set property on non-object".to_string()),
        }
    }

    /// Get object property
    pub fn get_property(&self, key: &str) -> Result<Option<Value>, String> {
        match self {
            Value::Object(obj) => Ok(obj.borrow().get(key).cloned()),
            _ => Err("Cannot get property from non-object".to_string()),
        }
    }
}

impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.to_string())
    }
}

impl fmt::Debug for Value {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Value::Null => write!(f, "Null"),
            Value::Bool(b) => write!(f, "Bool({})", b),
            Value::Number(n) => write!(f, "Number({})", n),
            Value::String(s) => write!(f, "String(\"{}\")", s),
            Value::Array(_) => write!(f, "Array(...)"),
            Value::Object(_) => write!(f, "Object(...)"),
            Value::Function(_) => write!(f, "Function"),
            Value::Error(e) => write!(f, "Error(\"{}\")", e),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Type checking tests
    #[test]
    fn test_type_of() {
        assert_eq!(Value::Null.type_of(), "null");
        assert_eq!(Value::Bool(true).type_of(), "boolean");
        assert_eq!(Value::Number(42.0).type_of(), "number");
        assert_eq!(Value::String("hello".to_string()).type_of(), "string");
        assert_eq!(Value::Array(Rc::new(RefCell::new(vec![]))).type_of(), "array");
        assert_eq!(Value::Object(Rc::new(RefCell::new(HashMap::new()))).type_of(), "object");
    }

    #[test]
    fn test_is_type_methods() {
        let num = Value::Number(42.0);
        let str = Value::String("hello".to_string());
        let arr = Value::empty_array();
        let obj = Value::empty_object();

        assert!(num.is_number());
        assert!(str.is_string());
        assert!(arr.is_array());
        assert!(obj.is_object());
        assert!(Value::Null.is_null());
        assert!(Value::Bool(true).is_bool());
    }

    // Truthiness tests
    #[test]
    fn test_is_truthy() {
        assert!(!Value::Null.is_truthy());
        assert!(!Value::Bool(false).is_truthy());
        assert!(Value::Bool(true).is_truthy());
        assert!(Value::Number(42.0).is_truthy());
        assert!(Value::Number(-1.0).is_truthy());
        assert!(!Value::Number(0.0).is_truthy());
        assert!(!Value::Number(f64::NAN).is_truthy());
        assert!(Value::String("hello".to_string()).is_truthy());
        assert!(!Value::String("".to_string()).is_truthy());
    }

    // Type conversion tests
    #[test]
    fn test_to_number() {
        assert_eq!(Value::Null.to_number(), 0.0);
        assert_eq!(Value::Bool(true).to_number(), 1.0);
        assert_eq!(Value::Bool(false).to_number(), 0.0);
        assert_eq!(Value::Number(42.0).to_number(), 42.0);
        assert_eq!(Value::Number(-3.14).to_number(), -3.14);
        assert_eq!(Value::String("123".to_string()).to_number(), 123.0);
        assert_eq!(Value::String("3.14".to_string()).to_number(), 3.14);
        assert_eq!(Value::String("invalid".to_string()).to_number(), 0.0);
    }

    #[test]
    fn test_to_string() {
        assert_eq!(Value::Null.to_string(), "null");
        assert_eq!(Value::Bool(true).to_string(), "true");
        assert_eq!(Value::Bool(false).to_string(), "false");
        assert_eq!(Value::Number(42.0).to_string(), "42");
        assert_eq!(Value::Number(3.14).to_string(), "3.14");
        assert_eq!(Value::String("hello".to_string()).to_string(), "hello");
    }

    // Array tests
    #[test]
    fn test_array_creation() {
        let arr = Value::array(vec![
            Value::Number(1.0),
            Value::Number(2.0),
            Value::Number(3.0),
        ]);
        assert_eq!(arr.array_len(), 3);
    }

    #[test]
    fn test_array_operations() {
        let arr = Value::empty_array();
        assert_eq!(arr.array_len(), 0);

        arr.array_push(Value::Number(42.0)).unwrap();
        assert_eq!(arr.array_len(), 1);

        let popped = arr.array_pop().unwrap();
        assert!(popped.is_some());
        assert_eq!(arr.array_len(), 0);
    }

    #[test]
    fn test_array_to_string() {
        let arr = Value::array(vec![
            Value::Number(1.0),
            Value::String("hello".to_string()),
            Value::Bool(true),
        ]);
        let s = arr.to_string();
        assert!(s.contains("1"));
        assert!(s.contains("hello"));
        assert!(s.contains("true"));
    }

    // Object tests
    #[test]
    fn test_object_creation() {
        let obj = Value::empty_object();
        assert_eq!(obj.object_keys().len(), 0);
    }

    #[test]
    fn test_object_operations() {
        let obj = Value::empty_object();

        obj.set_property("name".to_string(), Value::String("Alice".to_string()))
            .unwrap();
        obj.set_property("age".to_string(), Value::Number(30.0))
            .unwrap();

        assert_eq!(obj.object_keys().len(), 2);

        let name = obj.get_property("name").unwrap();
        assert_eq!(name.unwrap().to_string(), "Alice");

        let age = obj.get_property("age").unwrap();
        assert_eq!(age.unwrap().to_number(), 30.0);
    }

    // Equality tests
    #[test]
    fn test_equals() {
        assert_eq!(Value::Null, Value::Null);
        assert_eq!(Value::Bool(true), Value::Bool(true));
        assert_eq!(Value::Number(42.0), Value::Number(42.0));
        assert_eq!(
            Value::String("hello".to_string()),
            Value::String("hello".to_string())
        );

        assert_ne!(Value::Null, Value::Bool(false));
        assert_ne!(Value::Number(1.0), Value::Number(2.0));
    }

    // Edge cases
    #[test]
    fn test_negative_numbers() {
        let neg = Value::Number(-42.0);
        assert!(neg.is_truthy());
        assert_eq!(neg.to_number(), -42.0);
    }

    #[test]
    fn test_float_precision() {
        let f = Value::Number(3.14159265359);
        assert_eq!(f.to_number(), 3.14159265359);
    }

    #[test]
    fn test_large_numbers() {
        let large = Value::Number(1e10);
        assert_eq!(large.to_number(), 1e10);
    }

    #[test]
    fn test_empty_string() {
        let empty = Value::String("".to_string());
        assert!(!empty.is_truthy());
        assert_eq!(empty.to_string(), "");
    }

    #[test]
    fn test_unicode_string() {
        let unicode = Value::String("🚀 FreeLang".to_string());
        assert!(unicode.is_truthy());
        assert_eq!(unicode.to_string(), "🚀 FreeLang");
    }

    #[test]
    fn test_nested_arrays() {
        let inner = Value::array(vec![Value::Number(1.0), Value::Number(2.0)]);
        let outer = Value::array(vec![inner, Value::Number(3.0)]);
        assert_eq!(outer.array_len(), 2);
    }

    #[test]
    fn test_array_push_multiple() {
        let arr = Value::empty_array();
        for i in 0..10 {
            arr.array_push(Value::Number(i as f64)).unwrap();
        }
        assert_eq!(arr.array_len(), 10);
    }

    #[test]
    fn test_object_overwrite() {
        let obj = Value::empty_object();
        obj.set_property("key".to_string(), Value::Number(1.0))
            .unwrap();
        obj.set_property("key".to_string(), Value::Number(2.0))
            .unwrap();

        let val = obj.get_property("key").unwrap().unwrap();
        assert_eq!(val.to_number(), 2.0);
    }
}

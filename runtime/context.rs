// Execution Context
// Manages scope, variables, and call stack

use std::collections::HashMap;
use crate::core::Value;

/// Execution context for FreeLang programs
pub struct ExecutionContext {
    globals: HashMap<String, Value>,
    locals: Vec<HashMap<String, Value>>,
}

impl ExecutionContext {
    /// Create new context
    pub fn new() -> Self {
        ExecutionContext {
            globals: HashMap::new(),
            locals: vec![HashMap::new()],
        }
    }

    /// Set global variable
    pub fn set_global(&mut self, name: String, value: Value) {
        self.globals.insert(name, value);
    }

    /// Get global variable
    pub fn get_global(&self, name: &str) -> Option<Value> {
        self.globals.get(name).cloned()
    }

    /// Push new scope
    pub fn push_scope(&mut self) {
        self.locals.push(HashMap::new());
    }

    /// Pop scope
    pub fn pop_scope(&mut self) {
        if self.locals.len() > 1 {
            self.locals.pop();
        }
    }

    /// Set local variable in current scope
    pub fn set_local(&mut self, name: String, value: Value) {
        if let Some(scope) = self.locals.last_mut() {
            scope.insert(name, value);
        }
    }

    /// Get local variable from current scope
    pub fn get_local(&self, name: &str) -> Option<Value> {
        if let Some(scope) = self.locals.last() {
            scope.get(name).cloned()
        } else {
            None
        }
    }

    /// Get variable (local first, then global)
    pub fn get(&self, name: &str) -> Option<Value> {
        self.get_local(name).or_else(|| self.get_global(name))
    }

    /// Set variable (in current scope or global if not found locally)
    pub fn set(&mut self, name: String, value: Value) {
        if let Some(scope) = self.locals.last_mut() {
            scope.insert(name, value);
        }
    }
}

impl Default for ExecutionContext {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_global_vars() {
        let mut ctx = ExecutionContext::new();
        ctx.set_global("x".to_string(), Value::Number(42.0));
        assert_eq!(ctx.get_global("x").unwrap().to_number(), 42.0);
    }

    #[test]
    fn test_local_vars() {
        let mut ctx = ExecutionContext::new();
        ctx.set_local("x".to_string(), Value::Number(42.0));
        assert_eq!(ctx.get_local("x").unwrap().to_number(), 42.0);
    }
}

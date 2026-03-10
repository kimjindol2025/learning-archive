#include "StandardLibrary.h"
#include <iostream>
#include <sstream>
#include <cmath>
#include <algorithm>

namespace zlang {

// I/O Functions
void StandardLibrary::print(int64_t value) {
    std::cout << value;
}

void StandardLibrary::print(double value) {
    std::cout << value;
}

void StandardLibrary::print(const std::string& value) {
    std::cout << value;
}

void StandardLibrary::println(int64_t value) {
    std::cout << value << "\n";
}

void StandardLibrary::println(double value) {
    std::cout << value << "\n";
}

void StandardLibrary::println(const std::string& value) {
    std::cout << value << "\n";
}

std::string StandardLibrary::input() {
    std::string line;
    std::getline(std::cin, line);
    return line;
}

int64_t StandardLibrary::inputInt() {
    int64_t value;
    std::cin >> value;
    return value;
}

// String Functions
int64_t StandardLibrary::strlen(const std::string& str) {
    return str.length();
}

std::string StandardLibrary::substr(const std::string& str, int64_t start, int64_t length) {
    if (start < 0 || start >= (int64_t)str.length()) return "";
    return str.substr(start, length);
}

std::string StandardLibrary::strcat(const std::string& s1, const std::string& s2) {
    return s1 + s2;
}

int64_t StandardLibrary::strcmp(const std::string& s1, const std::string& s2) {
    int cmp = s1.compare(s2);
    if (cmp < 0) return -1;
    if (cmp > 0) return 1;
    return 0;
}

std::string StandardLibrary::toUpperCase(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(), ::toupper);
    return result;
}

std::string StandardLibrary::toLowerCase(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(), ::tolower);
    return result;
}

// Math Functions
int64_t StandardLibrary::abs(int64_t value) {
    return value < 0 ? -value : value;
}

int64_t StandardLibrary::max(int64_t a, int64_t b) {
    return a > b ? a : b;
}

int64_t StandardLibrary::min(int64_t a, int64_t b) {
    return a < b ? a : b;
}

int64_t StandardLibrary::pow(int64_t base, int64_t exp) {
    int64_t result = 1;
    for (int64_t i = 0; i < exp; ++i) {
        result *= base;
    }
    return result;
}

double StandardLibrary::sqrt(double value) {
    return std::sqrt(value);
}

// Type Conversion
std::string StandardLibrary::toString(int64_t value) {
    return std::to_string(value);
}

int64_t StandardLibrary::parseInt(const std::string& str) {
    try {
        return std::stoll(str);
    } catch (...) {
        return 0;
    }
}

double StandardLibrary::toDouble(const std::string& str) {
    try {
        return std::stod(str);
    } catch (...) {
        return 0.0;
    }
}

// Utility
std::vector<int64_t> StandardLibrary::range(int64_t start, int64_t end) {
    std::vector<int64_t> result;
    for (int64_t i = start; i <= end; ++i) {
        result.push_back(i);
    }
    return result;
}

int64_t StandardLibrary::sum(const std::vector<int64_t>& arr) {
    int64_t total = 0;
    for (int64_t val : arr) {
        total += val;
    }
    return total;
}

double StandardLibrary::avg(const std::vector<int64_t>& arr) {
    if (arr.empty()) return 0.0;
    return (double)sum(arr) / arr.size();
}

}  // namespace zlang

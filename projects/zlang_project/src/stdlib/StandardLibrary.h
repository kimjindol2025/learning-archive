#ifndef STANDARD_LIBRARY_H
#define STANDARD_LIBRARY_H

#include <string>
#include <vector>
#include <cstdint>

namespace zlang {

class StandardLibrary {
public:
    // I/O Functions
    static void print(int64_t value);
    static void print(double value);
    static void print(const std::string& value);

    static void println(int64_t value);
    static void println(double value);
    static void println(const std::string& value);

    static std::string input();
    static int64_t inputInt();

    // String Functions
    static int64_t strlen(const std::string& str);
    static std::string substr(const std::string& str, int64_t start, int64_t length);
    static std::string strcat(const std::string& s1, const std::string& s2);
    static int64_t strcmp(const std::string& s1, const std::string& s2);
    static std::string toUpperCase(const std::string& str);
    static std::string toLowerCase(const std::string& str);

    // Math Functions
    static int64_t abs(int64_t value);
    static int64_t max(int64_t a, int64_t b);
    static int64_t min(int64_t a, int64_t b);
    static int64_t pow(int64_t base, int64_t exp);
    static double sqrt(double value);

    // Type Conversion
    static std::string toString(int64_t value);
    static int64_t parseInt(const std::string& str);
    static double toDouble(const std::string& str);

    // Utility
    static std::vector<int64_t> range(int64_t start, int64_t end);
    static int64_t sum(const std::vector<int64_t>& arr);
    static double avg(const std::vector<int64_t>& arr);
};

}  // namespace zlang

#endif

console.log('Hello from file execution!');
console.log('Current time:', new Date().toISOString());

// Test some computation
const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);
console.log('5! =', factorial(5));

// Test async
setTimeout(() => {
    console.log('Async operation completed!');
}, 100);
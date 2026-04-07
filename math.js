export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export const multiply = (a, b) => a * b;
export const division = (a, b) => a / b;

// NEW: Business logic for the taxi app
export const calculateFare = (pricePerKm, distance) => {
    const baseFee = 5.00; // Every ride starts with a 500naira fee
    return baseFee + (pricePerKm * distance);
};
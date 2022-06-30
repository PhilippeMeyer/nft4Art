export const waitFor = (conditionFunction) => new Promise((resolve) => {
    const interval = setInterval(() => {
        if (conditionFunction()) {
            clearInterval(interval);
            resolve();
        }
    }, 500);
});

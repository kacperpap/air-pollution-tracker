export function logWithTime(message: string): void {
    const now = new Date();
    const formattedTime = now.toISOString().replace('T', ' ').replace('Z', '');
    console.log(`[${formattedTime}] ${message}\n`);
}

export type NotificationProps = {
    message: string;
    description?: string;
    type: 'success' | 'error' | '';
    duration?: number;
    onClose?: () => void;
};
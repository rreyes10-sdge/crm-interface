export default function getStatusColor(status: string): import("csstype").Property.Color | undefined {
    switch (status) {
        case 'Services Not Started':
            return 'red';
        case 'Services Started':
            return 'orange';
        case 'Overdue Follow Ups':
            return 'blue';
        case 'Completed Services':
            return 'green';
        default:
            return undefined;
    }
}
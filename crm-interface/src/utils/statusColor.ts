export default function getStatusColor(status: string): import("csstype").Property.Color | undefined {
    switch (status) {
        case 'Projects Not Started':
            return 'red';
        case 'Services Started':
            return 'orange';
        case 'Follow Up Dates':
            return 'blue';
        case 'Completed Projects':
            return 'green';
        default:
            return undefined;
    }
}
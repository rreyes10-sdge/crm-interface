export interface VehicleGroup {
    id: number;
    vehicleClass: string;
    numVehicles: number;
    avgDailyMileage: number;
}

export interface ChargerGroup {
    id: number;
    numChargers: number;
    chargerKW: number;
}

export interface OptionalSettings {
    fossilFuelPrice?: number;
    fossilFuelMultiplier?: number;
    fossilFuelEfficiency?: number;
    transformerCapacity?: number;
}

export interface CalculationResults {
    annualFuelSavings: number;
    totalCost: number;
    paybackPeriod: number;
    co2Reduction: number;
}

export interface Results {
    vehicleGroups: VehicleGroup[];
    chargerGroups: ChargerGroup[];
    settings: OptionalSettings;
    calculations: CalculationResults | null;
}

export interface ChargingBehavior {
    days: string[];
    startTime: string;
    endTime: string;
} 
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
    fossil_fuel_daily_avg_cost: number;
    fossil_fuel_weekly_avg_cost: number;
    fossil_fuel_monthly_avg_cost: number;
    fossil_fuel_yearly_avg_cost: number;
    optimal_scenario: boolean;
    total_daily_charger_energy_output: number;
    total_daily_vehicle_energy_needed: number;
    unmanaged_scenario: boolean;
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
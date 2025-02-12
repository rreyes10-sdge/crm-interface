import React, { useState, useEffect } from 'react';

const EvCalculator: React.FC = () => {
    const [chargerIndex, setChargerIndex] = useState(1);

    useEffect(() => {
        addCharger(); // Pre-populate the first charger entry on page load
    }, []);

    const addCharger = () => {
        setChargerIndex(prevIndex => prevIndex + 1);
    };

    const checkInputsValidity = (fieldsetId: string, nextButtonId: string) => {
        const inputs = document.querySelectorAll(`#${fieldsetId} input, #${fieldsetId} select`);
        const nextButton = document.getElementById(nextButtonId) as HTMLInputElement;

        let allValid = true;
        inputs.forEach(input => {
            const element = input as HTMLInputElement | HTMLSelectElement;
            if (!element.checkValidity()) {
                allValid = false;
            }
        });

        if (nextButton) {
            nextButton.disabled = !allValid;
        }
    };

    const validateFieldset = (fieldset: HTMLElement) => {
        const inputs = fieldset.querySelectorAll('input, select');
        let allValid = true;
        inputs.forEach(input => {
            const element = input as HTMLInputElement | HTMLSelectElement;
            if (!element.checkValidity()) {
                allValid = false;
            }
        });

        const nextButton = fieldset.querySelector('.next.action-button') as HTMLInputElement;
        if (nextButton) {
            nextButton.disabled = !allValid;

            if (!allValid) {
                nextButton.style.backgroundColor = '#ccc';
                nextButton.style.cursor = 'not-allowed';
            } else {
                nextButton.style.backgroundColor = '';
                nextButton.style.cursor = '';
            }
        }
    };

    useEffect(() => {
        document.querySelectorAll('fieldset').forEach(fieldset => {
            const inputs = fieldset.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('input', () => validateFieldset(fieldset));
            });
        });

        document.querySelectorAll('fieldset').forEach(fieldset => {
            validateFieldset(fieldset);
        });
    }, []);

    return (
        <div>
            <h1 className="fs-header">EV Cost Calculator</h1>
            <form id="msform" action="/" method="post">
                <ul id="progressbar">
                    <li className="active">Vehicle Selection</li>
                    <li>Charging Behavior</li>
                    <li>Charger Selection</li>
                    <li>Time of Year</li>
                </ul>
                <button type="button" id="clearButton" onClick={() => {}} style={{ display: 'none' }}>Clear</button>
                <fieldset id="vehicleSelection">
                    <h2 className="fs-title">Vehicle Selection</h2>
                    <h3 className="fs-subtitle">Set vehicle parameters</h3>
                    <input type="number" name="num_vehicles" placeholder="Number of Vehicles" min="1" required />
                    <input type="number" name="miles_driven_per_day" placeholder="Miles Driven Per Day" min="1" step="any" required />
                    <input type="number" name="battery_size" step="any" placeholder="Vehicle Battery Size" min="1" required />
                    <input type="number" name="vehicle_efficiency" step="any" placeholder="Vehicle Efficiency" min="0.01" required />
                    <input type="button" id="nextVehicleSelection" className="next action-button" value="Next" disabled />
                    <div id="errorBanner" style={{ display: 'none', color: 'red' }}></div>
                </fieldset>
                <fieldset id="chargingBehavior">
                    <h2 className="fs-title">Charging Behavior</h2>
                    <h3 className="fs-subtitle">Specify charger information</h3>
                    <input type="number" name="charging_hours_per_day" min="1" max="24" placeholder="Charging Hours Per Day" required />
                    <input type="number" name="charging_days_per_week" step="any" min="1" max="7" placeholder="Charging Days Per Week" required />
                    <input type="button" name="previous" className="previous action-button" value="Back" />
                    <input type="button" id="nextChargingBehavior" className="next action-button" value="Next" disabled />
                </fieldset>
                <fieldset id="chargerSelection">
                    <h2 className="fs-title">Charger Selection</h2>
                    <h3 className="fs-subtitle">Select Charger Type and specify the count for each type</h3>
                    <div className="charger-selection-container" id="charger-container">
                        {/* Charger entries will be dynamically added here */}
                    </div>
                    <button type="button" className="secondary-button" onClick={addCharger}>Add Another Charger</button><br />
                    <input type="button" name="previous" className="previous action-button" value="Back" />
                    <input type="button" name="nextChargerSelection" className="next action-button" value="Next" />
                </fieldset>
                <fieldset id="timeOfYear">
                    Season: <select name="season">
                        <option value="Summer">Summer: June 1 - October 31</option>
                        <option value="Winter (March and April)">Winter: March 1 - April 30)</option>
                        <option value="Winter (excluding March and April)">Winter: Nov 1 - Feb 29, May 1 - May 30</option>
                    </select><br />
                    Time of Day: <select name="time_of_day">
                        <option value="SOP">Super Off-Peak</option>
                        <option value="Off-Peak">Off-Peak</option>
                        <option value="On-Peak">On-Peak</option>
                    </select><br />
                    <input type="button" name="previous" className="previous action-button" value="Back" />
                    <button type="submit" className="submit action-button">Calculate</button>
                </fieldset>
            </form>
        </div>
    );
};

export default EvCalculator;
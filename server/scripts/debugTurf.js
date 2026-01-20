import * as turf from '@turf/turf';

const coordinates = [
    [72.83207, 18.95819],
    [73.79001, 19.99932], // approx Nashik
    [74.77489, 20.90422], // approx Dhule
    [77.10241, 28.70409]  // approx Delhi
];

function testTurf() {
    console.log("Testing Turf Length...");

    try {
        const line = turf.lineString(coordinates);
        console.log("LineString created.");

        const length = turf.length(line, { units: 'kilometers' });
        console.log(`Calculated Length: ${length} km`);

        if (length === 0) {
            console.error("FAIL: Length is 0");
        } else if (length > 1000) {
            console.log("PASS: Length looks reasonable (approx 1200km expected)");
        } else {
            console.log("WARN: Length is non-zero but unexpected:", length);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testTurf();

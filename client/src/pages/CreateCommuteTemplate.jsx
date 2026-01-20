import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const CreateCommuteTemplate = () => {
    const navigate = useNavigate();
    const [template, setTemplate] = useState({
        name: '',
        source: null,
        destination: null,
        time: '',
        daysOfWeek: [],
        price: '',
        totalSeats: '',
        vehicle: { model: '', plateNumber: '', capacity: '' },
        visibility: 'public'
    });
    const [loading, setLoading] = useState(false);

    const handleSourceSelect = (place) => {
        setTemplate({
            ...template, source: {
                name: place.name || place.formatted_address,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address
            }
        });
    };

    const handleDestSelect = (place) => {
        setTemplate({
            ...template, destination: {
                name: place.name || place.formatted_address,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address
            }
        });
    };

    const handleDayToggle = (dayIndex) => {
        const currentDays = template.daysOfWeek;
        if (currentDays.includes(dayIndex)) {
            setTemplate({ ...template, daysOfWeek: currentDays.filter(d => d !== dayIndex) });
        } else {
            setTemplate({ ...template, daysOfWeek: [...currentDays, dayIndex].sort() });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!template.source || !template.destination || template.daysOfWeek.length === 0) {
            alert("Please fill in all required fields.");
            return;
        }

        setLoading(true);
        try {

            await api.post('/commute/create', template);
            alert("Template Created!");
            navigate('/dashboard');
        } catch (error) {
            console.error("Create Template Error:", error);
            alert("Failed to create template");
        } finally {
            setLoading(false);
        }
    };

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-12">
            <div className="container mx-auto max-w-2xl">
                <h2 className="text-3xl font-bold font-heading mb-8 text-text text-center">Create Commute Template</h2>

                <Card className="shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Template Name"
                            placeholder="e.g., Work to Home"
                            value={template.name}
                            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                            required
                            fullWidth
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-text font-medium mb-1.5 text-sm">Source</label>
                                <div className="relative">
                                    <PlaceAutocomplete
                                        onPlaceSelect={handleSourceSelect}
                                        placeholder="Start Location"
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-muted/50"
                                    />
                                    <div className="absolute right-3 top-3.5 text-text-muted pointer-events-none">📍</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-text font-medium mb-1.5 text-sm">Destination</label>
                                <div className="relative">
                                    <PlaceAutocomplete
                                        onPlaceSelect={handleDestSelect}
                                        placeholder="End Location"
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-muted/50"
                                    />
                                    <div className="absolute right-3 top-3.5 text-text-muted pointer-events-none">🏁</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Departure Time"
                                type="time"
                                value={template.time}
                                onChange={(e) => setTemplate({ ...template, time: e.target.value })}
                                required
                                fullWidth
                            />
                            <Input
                                label="Price per Seat (₹)"
                                type="number"
                                value={template.price}
                                onChange={(e) => setTemplate({ ...template, price: Number(e.target.value) })}
                                required
                                fullWidth
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-text font-medium mb-3 text-sm">Repeats On</label>
                            <div className="flex flex-wrap gap-2">
                                {days.map((day, index) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleDayToggle(index)}
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full text-xs md:text-sm font-bold transition-all flex items-center justify-center ${template.daysOfWeek.includes(index)
                                            ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-110'
                                            : 'bg-neutral text-text-muted hover:bg-neutral-dark'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Vehicle Model"
                                placeholder="e.g., Swift Dzire"
                                value={template.vehicle.model}
                                onChange={(e) => setTemplate({ ...template, vehicle: { ...template.vehicle, model: e.target.value } })}
                                required
                                fullWidth
                            />
                            <Input
                                label="Total Seats (Offered)"
                                type="number"
                                value={template.totalSeats}
                                onChange={(e) => setTemplate({ ...template, totalSeats: Number(e.target.value) })}
                                required
                                fullWidth
                                min="1"
                                max="8"
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                isLoading={loading}
                                variant="primary"
                                fullWidth
                                size="lg"
                                className="shadow-xl shadow-primary/20"
                            >
                                Save Template
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default CreateCommuteTemplate;

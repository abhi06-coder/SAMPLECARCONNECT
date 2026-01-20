import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const ChangePassword = () => {
    const { updateProfile } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!formData.password) {
            setError("Please enter a new password");
            setLoading(false);
            return;
        }

        try {
            const result = await updateProfile({
                password: formData.password
            });

            if (result.success) {
                setMessage("Password updated successfully");
                setTimeout(() => navigate('/profile'), 2000);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8 transition-colors duration-300">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

            <Card className="max-w-md w-full animate-fade-in relative z-10 shadow-2xl border-none">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>

                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center font-heading text-text pt-4">Change Password</h2>

                {message && (
                    <div className="bg-success/10 text-success p-3 rounded-xl mb-6 border border-success/20 flex items-center text-sm font-medium">
                        <span className="mr-2 text-lg">✓</span>{message}
                    </div>
                )}
                {error && (
                    <div className="bg-error/10 text-error p-3 rounded-xl mb-6 border border-error/20 flex items-center text-sm font-medium">
                        <span className="mr-2 text-lg">⚠</span>{error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="New Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        fullWidth
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        fullWidth
                    />

                    <div className="pt-2 space-y-3">
                        <Button
                            type="submit"
                            isLoading={loading}
                            variant="primary"
                            fullWidth
                            size="lg"
                            className="shadow-lg shadow-primary/20"
                        >
                            Update Password
                        </Button>
                        <Button
                            type="button"
                            onClick={() => navigate('/profile')}
                            variant="ghost"
                            fullWidth
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ChangePassword;

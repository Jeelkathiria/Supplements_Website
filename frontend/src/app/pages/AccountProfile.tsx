import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { toast } from 'sonner';
import * as userService from '../../services/userService';

export const AccountProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedPhone, setEditedPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditedName(user?.name || '');
      setEditedPhone(user?.phone || '');
    }
  }, [user?.name, user?.phone, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!editedName.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!editedPhone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleaned = editedPhone.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        newErrors.phone = 'Phone number must be 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const phoneToSave = editedPhone.replace(/\D/g, '');

      await userService.updateProfile({
        name: editedName.trim(),
        phone: phoneToSave,
      });

      updateUser({
        name: editedName.trim(),
        phone: phoneToSave,
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={() => {
              setEditedName(user?.name || '');
              setEditedPhone(user?.phone || '');
              setErrors({});
              setIsEditing(true);
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-neutral-300'
              }`}
              placeholder="Enter your name"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-gray-100 text-neutral-600 cursor-not-allowed"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editedPhone}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setEditedPhone(val);
              }}
              maxLength={10}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-neutral-300'
              }`}
              placeholder="10 digit number"
            />
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setErrors({});
              }}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
            <p className="text-neutral-900">{user?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <p className="text-neutral-900">{user?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
            <p className="text-neutral-900">{user?.phone || 'Not provided'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountProfile;

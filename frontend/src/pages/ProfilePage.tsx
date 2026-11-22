import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Store, 
  Building2, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  X, 
  Package, 
  Layers, 
  ShieldCheck, 
  Calendar,
  Percent
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile } from '../types';

/**
 * SERENDIP Personal Information / Profile Management Page
 * Allows authenticated customers, sellers, and administrators to view and update
 * their personal profile details, contact information, role attributes, and credentials.
 */
export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [department, setDepartment] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const data = await api.getUser(user.id);
        setProfile(data);
        initForm(data);
      } catch (err: unknown) {
        // Fallback to auth context details if fetch fails
        const fallback: UserProfile = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          accountStatus: 'ACTIVE',
        };
        setProfile(fallback);
        initForm(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, isAuthenticated, navigate]);

  const initForm = (data: UserProfile) => {
    setFullName(data.fullName || '');
    setEmail(data.email || '');
    setPhoneNumber(data.phoneNumber || '');
    setDeliveryAddress(data.deliveryAddress || '');
    setShopName(data.shopName || '');
    setShopDescription(data.shopDescription || '');
    setOriginCity(data.originCity || 'Colombo');
    setDepartment(data.department || 'Operations');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCancel = () => {
    if (profile) {
      initForm(profile);
    }
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!fullName.trim()) {
      setStatusMessage({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'A valid email address is required.' });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password and confirmation password do not match.' });
      return;
    }
    if (user?.role === 'SELLER' && !shopName.trim()) {
      setStatusMessage({ type: 'error', text: 'Merchant Storefront Name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await api.updateUserProfile(user!.id, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim() || undefined,
        deliveryAddress: user?.role === 'BUYER' ? deliveryAddress.trim() : undefined,
        shopName: user?.role === 'SELLER' ? shopName.trim() : undefined,
        shopDescription: user?.role === 'SELLER' ? shopDescription.trim() : undefined,
        originCity: user?.role === 'SELLER' ? originCity.trim() : undefined,
        department: user?.role === 'ADMIN' ? department.trim() : undefined,
        newPassword: newPassword ? newPassword.trim() : undefined,
      });

      setProfile(updated);
      initForm(updated);
      setIsEditing(false);

      // Update global AuthContext user details
      updateUser({
        fullName: updated.fullName,
        email: updated.email,
      });

      // Update basic auth credentials if password or email changed
      if (newPassword) {
        localStorage.setItem(
          'serendip_auth_credentials',
          btoa(`${updated.email}:${newPassword.trim()}`)
        );
      } else if (email.trim().toLowerCase() !== user!.email) {
        // Keep password part from existing token
        const existingToken = localStorage.getItem('serendip_auth_credentials');
        if (existingToken) {
          try {
            const decoded = atob(existingToken);
            const parts = decoded.split(':');
            if (parts.length > 1) {
              const oldPass = parts.slice(1).join(':');
              localStorage.setItem(
                'serendip_auth_credentials',
                btoa(`${updated.email}:${oldPass}`)
              );
            }
          } catch {
            // Keep existing
          }
        }
      }

      setStatusMessage({
        type: 'success',
        text: 'Your personal information has been successfully updated.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update personal information.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Established Member';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#315D4F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-[#7A755D]">Loading personal details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#7A755D] mb-6">
        <Link to="/" className="hover:text-[#315D4F] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[#315D4F] font-semibold">Personal Information</span>
      </div>

      {/* Profile Header Banner */}
      <div className="bg-[#315D4F] text-[#F9F6EF] rounded-3xl p-6 sm:p-8 shadow-elevated border border-[#426F60] relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#A48B57]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Large Avatar Initial */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#A48B57] text-[#19372E] border-2 border-[#BD9F75] flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold shadow-md shrink-0 uppercase">
              {profile?.fullName ? profile.fullName.charAt(0) : user?.fullName.charAt(0)}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#F9F6EF]">
                  {profile?.fullName || user?.fullName}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#19372E] text-[#BD9F75] border border-[#A48B57]/40 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {profile?.accountStatus || 'ACTIVE'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#F9F6EF]/80">
                <span className="font-semibold text-[#A48B57] uppercase tracking-wider">
                  {profile?.role === 'BUYER' && 'International Buyer'}
                  {profile?.role === 'SELLER' && 'Ceylon Merchant / Producer'}
                  {profile?.role === 'ADMIN' && 'Platform Governance Administrator'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#F9F6EF]/70">
                  <Calendar className="w-3.5 h-3.5 text-[#A48B57]" />
                  Member since {formatDate(profile?.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Edit / Actions Button */}
          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setStatusMessage(null);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A48B57] text-[#19372E] font-bold text-xs hover:bg-[#BD9F75] transition-all shadow-sm shrink-0 self-start sm:self-center"
            >
              <Edit3 className="w-4 h-4" />
              Edit Personal Information
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#19372E] text-[#F9F6EF] font-semibold text-xs hover:bg-[#426F60] transition-all border border-[#426F60] shrink-0 self-start sm:self-center"
            >
              <X className="w-4 h-4 text-[#A48B57]" />
              Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl mb-8 flex items-start gap-3 border transition-all animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-medium leading-relaxed">
            {statusMessage.text}
          </div>
        </div>
      )}

      {/* Main Content: View Cards OR Edit Form */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Card 1: Core Personal & Contact Details */}
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#D6CBB5]/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#315D4F]/10 text-[#315D4F] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#222B1F]">Contact & Identity</h2>
                  <p className="text-[11px] text-[#7A755D]">Primary account credentials and communication details</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Full Name</span>
                <p className="text-sm font-bold text-[#222B1F] flex items-center gap-2">
                  {profile?.fullName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Email Address</span>
                <p className="text-sm font-medium text-[#222B1F] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#A48B57]" />
                  {profile?.email}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Phone Number</span>
                <p className="text-sm font-medium text-[#222B1F] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#A48B57]" />
                  {profile?.phoneNumber || <span className="text-[#ADA78A] italic">Not provided</span>}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Account Role</span>
                <p className="text-sm font-semibold text-[#315D4F] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#A48B57]" />
                  {profile?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Role Specific Details */}
          {profile?.role === 'BUYER' && (
            <div className="bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-[#D6CBB5]/60 pb-4">
                <div className="w-8 h-8 rounded-lg bg-[#315D4F]/10 text-[#315D4F] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#222B1F]">Shipping & Delivery</h2>
                  <p className="text-[11px] text-[#7A755D]">Default international destination for Ceylon order fulfillment</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Delivery Address</span>
                <p className="text-sm font-medium text-[#222B1F] bg-[#F9F6EF] p-4 rounded-2xl border border-[#D6CBB5]/60">
                  {profile?.deliveryAddress || <span className="text-[#ADA78A] italic">No delivery address saved yet</span>}
                </p>
              </div>
            </div>
          )}

          {profile?.role === 'SELLER' && (
            <div className="bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-[#D6CBB5]/60 pb-4">
                <div className="w-8 h-8 rounded-lg bg-[#315D4F]/10 text-[#315D4F] flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#222B1F]">Merchant Storefront Information</h2>
                  <p className="text-[11px] text-[#7A755D]">Public Ceylon artisan storefront and regional origin</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Shop Name</span>
                  <p className="text-sm font-bold text-[#222B1F]">{profile?.shopName || 'Registered Ceylon Merchant'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Origin City / District</span>
                  <p className="text-sm font-medium text-[#222B1F] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#A48B57]" />
                    {profile?.originCity || 'Colombo'}
                  </p>
                </div>

                {profile?.commissionRate !== undefined && profile?.commissionRate !== null && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Platform Commission Rate</span>
                    <p className="text-sm font-medium text-[#222B1F] flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-[#A48B57]" />
                      {profile.commissionRate}%
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Storefront Story & Craft Description</span>
                <p className="text-xs text-[#222B1F] leading-relaxed bg-[#F9F6EF] p-4 rounded-2xl border border-[#D6CBB5]/60">
                  {profile?.shopDescription || <span className="text-[#ADA78A] italic">No description provided yet</span>}
                </p>
              </div>
            </div>
          )}

          {profile?.role === 'ADMIN' && (
            <div className="bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-[#D6CBB5]/60 pb-4">
                <div className="w-8 h-8 rounded-lg bg-[#315D4F]/10 text-[#315D4F] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#222B1F]">Administrative Organization</h2>
                  <p className="text-[11px] text-[#7A755D]">Platform management department and privileges</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#7A755D] uppercase tracking-wider block">Department</span>
                <p className="text-sm font-bold text-[#222B1F]">{profile?.department || 'Operations'}</p>
              </div>
            </div>
          )}

          {/* Quick Role Portal Shortcuts */}
          <div className="bg-[#E9E4D7]/50 rounded-3xl border border-[#D6CBB5] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#222B1F]">Looking to manage your activity?</h3>
              <p className="text-xs text-[#7A755D]">Quick shortcuts based on your account privileges.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {profile?.role === 'BUYER' && (
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#315D4F] text-[#F9F6EF] text-xs font-semibold hover:bg-[#19372E] transition-all"
                >
                  <Package className="w-3.5 h-3.5 text-[#A48B57]" />
                  View My Orders
                </Link>
              )}
              {profile?.role === 'SELLER' && (
                <>
                  <Link
                    to="/seller/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#315D4F] text-[#F9F6EF] text-xs font-semibold hover:bg-[#19372E] transition-all"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#A48B57]" />
                    Seller Dashboard
                  </Link>
                  <Link
                    to="/seller/orders"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A48B57] text-[#19372E] text-xs font-bold hover:bg-[#BD9F75] transition-all"
                  >
                    Merchant Orders
                  </Link>
                </>
              )}
              {profile?.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#315D4F] text-[#F9F6EF] text-xs font-semibold hover:bg-[#19372E] transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A48B57]" />
                  Admin Console
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Edit Profile Form */
        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#D6CBB5] p-6 sm:p-8 shadow-premium space-y-6">
            <div className="flex items-center justify-between border-b border-[#D6CBB5]/60 pb-4">
              <div>
                <h2 className="text-base font-bold text-[#222B1F]">Edit Personal Information</h2>
                <p className="text-[11px] text-[#7A755D]">Update your contact details, address, and credentials.</p>
              </div>
              <span className="text-[10px] font-bold text-[#A48B57] uppercase tracking-wider bg-[#E9E4D7] px-2.5 py-1 rounded-lg">
                Editing Mode
              </span>
            </div>

            {/* Core User Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#222B1F]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kamal Perera"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium"
                  />
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A48B57]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#222B1F]">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kamal@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A48B57]" />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#222B1F]">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium"
                  />
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A48B57]" />
                </div>
              </div>
            </div>

            {/* Role-Specific Editable Fields */}
            {profile?.role === 'BUYER' && (
              <div className="pt-4 border-t border-[#D6CBB5]/60 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#315D4F] flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#A48B57]" />
                  Delivery & Shipping Destination
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#222B1F]">
                    Default Delivery Address
                  </label>
                  <textarea
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street address, City, Postal Code, Country"
                    className="w-full p-3 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium resize-none"
                  />
                </div>
              </div>
            )}

            {profile?.role === 'SELLER' && (
              <div className="pt-4 border-t border-[#D6CBB5]/60 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#315D4F] flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-[#A48B57]" />
                  Merchant Storefront Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#222B1F]">
                      Storefront Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Ceylon Royal Teas"
                      className="w-full px-3 py-2.5 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#222B1F]">
                      Origin City / District
                    </label>
                    <input
                      type="text"
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      placeholder="e.g. Kandy, Galle, Ratnapura"
                      className="w-full px-3 py-2.5 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-[#222B1F]">
                      Storefront Description & Artisan Heritage
                    </label>
                    <textarea
                      rows={3}
                      value={shopDescription}
                      onChange={(e) => setShopDescription(e.target.value)}
                      placeholder="Describe your craft, Ceylon origins, harvest methods, and artisan heritage..."
                      className="w-full p-3 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {profile?.role === 'ADMIN' && (
              <div className="pt-4 border-t border-[#D6CBB5]/60 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#315D4F] flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#A48B57]" />
                  Administrative Department
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#222B1F]">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Operations, Compliance"
                    className="w-full px-3 py-2.5 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {/* Optional Password Update Section */}
            <div className="pt-4 border-t border-[#D6CBB5]/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#315D4F] flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#A48B57]" />
                    Change Password (Optional)
                  </h3>
                  <p className="text-[11px] text-[#7A755D]">Leave blank if you do not want to change your password.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#A48B57] hover:text-[#315D4F] font-semibold flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#222B1F]">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters (or leave empty)"
                    className="w-full px-3 py-2.5 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#222B1F]">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2.5 text-xs bg-[#F9F6EF]/70 border border-[#D6CBB5] rounded-xl text-[#222B1F] placeholder:text-[#ADA78A] focus:border-[#A48B57] focus:bg-white focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl border border-[#D6CBB5] text-xs font-bold text-[#222B1F] hover:bg-[#E9E4D7] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#315D4F] text-[#F9F6EF] text-xs font-bold hover:bg-[#19372E] border border-[#A48B57] transition-all shadow-md disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#F9F6EF] border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-[#A48B57]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

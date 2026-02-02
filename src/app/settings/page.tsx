'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, User, Bell, Database, Loader2, CheckCircle2, Mail, Send } from 'lucide-react';
import {
  saveNotificationPreferences,
  getNotificationPreferences,
  saveUserProfile,
  getUserProfile,
  saveDefaultValues,
  getDefaultValues,
  sendTestNotification,
  type NotificationPreferences,
  type UserProfile,
  type DefaultValues,
} from './actions';

export default function SettingsPage() {
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    company: 'Murray Aspinwall LP',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Notification preferences state
  const [notifications, setNotifications] = useState<Omit<NotificationPreferences, 'id'>>({
    lease_expiration_reminders: true,
    maintenance_alerts: true,
    payment_reminders: false,
    notification_email: '',
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const [testSent, setTestSent] = useState<string | null>(null);

  // Default values state
  const [defaults, setDefaults] = useState<DefaultValues>({
    vacancy_rate: 5,
    mgmt_fee: 10,
    maintenance_reserve: 5,
    appreciation_rate: 3,
    rent_growth_rate: 2,
    interest_rate: 7,
  });
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [defaultsSaved, setDefaultsSaved] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    async function loadSettings() {
      const [savedProfile, savedNotifications, savedDefaults] = await Promise.all([
        getUserProfile(),
        getNotificationPreferences(),
        getDefaultValues(),
      ]);

      if (savedProfile) {
        setProfile(savedProfile);
      }

      if (savedNotifications) {
        setNotifications({
          lease_expiration_reminders: savedNotifications.lease_expiration_reminders,
          maintenance_alerts: savedNotifications.maintenance_alerts,
          payment_reminders: savedNotifications.payment_reminders,
          notification_email: savedNotifications.notification_email || '',
        });
      }

      if (savedDefaults) {
        setDefaults(savedDefaults);
      }
    }

    loadSettings();
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    const result = await saveUserProfile(profile);
    setSavingProfile(false);
    if (result.success) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    setNotificationsSaved(false);
    const result = await saveNotificationPreferences(notifications);
    setSavingNotifications(false);
    if (result.success) {
      setNotificationsSaved(true);
      setTimeout(() => setNotificationsSaved(false), 3000);
    }
  };

  const handleSaveDefaults = async () => {
    setSavingDefaults(true);
    setDefaultsSaved(false);
    const result = await saveDefaultValues(defaults);
    setSavingDefaults(false);
    if (result.success) {
      setDefaultsSaved(true);
      setTimeout(() => setDefaultsSaved(false), 3000);
    }
  };

  const handleSendTest = async (type: 'lease_expiration' | 'maintenance_alert' | 'payment_reminder') => {
    if (!notifications.notification_email) {
      return;
    }
    setSendingTest(type);
    setTestSent(null);
    const result = await sendTestNotification(notifications.notification_email, type);
    setSendingTest(null);
    if (result.success) {
      setTestSent(type);
      setTimeout(() => setTestSent(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company / LLC Name</Label>
              <Input
                id="company"
                placeholder="Murray Aspinwall LP"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : profileSaved ? (
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              ) : null}
              {profileSaved ? 'Saved!' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure email notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="notification_email">Notification Email</Label>
              <div className="flex gap-2">
                <Input
                  id="notification_email"
                  type="email"
                  placeholder="notifications@youremail.com"
                  value={notifications.notification_email}
                  onChange={(e) => setNotifications({ ...notifications, notification_email: e.target.value })}
                  className="flex-1"
                />
                <Mail className="h-4 w-4 mt-3 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                All notification emails will be sent to this address
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="lease"
                  checked={notifications.lease_expiration_reminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, lease_expiration_reminders: !!checked })
                  }
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lease" className="cursor-pointer">Lease Expiration Reminders</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendTest('lease_expiration')}
                      disabled={!notifications.notification_email || sendingTest === 'lease_expiration'}
                    >
                      {sendingTest === 'lease_expiration' ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : testSent === 'lease_expiration' ? (
                        <CheckCircle2 className="mr-2 h-3 w-3 text-green-500" />
                      ) : (
                        <Send className="mr-2 h-3 w-3" />
                      )}
                      {testSent === 'lease_expiration' ? 'Sent!' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get notified 30, 60, and 90 days before lease expires
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="maintenance"
                  checked={notifications.maintenance_alerts}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, maintenance_alerts: !!checked })
                  }
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance" className="cursor-pointer">Maintenance Alerts</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendTest('maintenance_alert')}
                      disabled={!notifications.notification_email || sendingTest === 'maintenance_alert'}
                    >
                      {sendingTest === 'maintenance_alert' ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : testSent === 'maintenance_alert' ? (
                        <CheckCircle2 className="mr-2 h-3 w-3 text-green-500" />
                      ) : (
                        <Send className="mr-2 h-3 w-3" />
                      )}
                      {testSent === 'maintenance_alert' ? 'Sent!' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notifications for pending maintenance items
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="payment"
                  checked={notifications.payment_reminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, payment_reminders: !!checked })
                  }
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment" className="cursor-pointer">Payment Reminders</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendTest('payment_reminder')}
                      disabled={!notifications.notification_email || sendingTest === 'payment_reminder'}
                    >
                      {sendingTest === 'payment_reminder' ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : testSent === 'payment_reminder' ? (
                        <CheckCircle2 className="mr-2 h-3 w-3 text-green-500" />
                      ) : (
                        <Send className="mr-2 h-3 w-3" />
                      )}
                      {testSent === 'payment_reminder' ? 'Sent!' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upcoming rent collection reminders
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleSaveNotifications} disabled={savingNotifications}>
                {savingNotifications ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : notificationsSaved ? (
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                ) : null}
                {notificationsSaved ? 'Saved!' : 'Save Preferences'}
              </Button>
              {!notifications.notification_email && (
                <p className="text-sm text-muted-foreground">
                  Enter an email address to enable notifications
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Values */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Default Values</CardTitle>
            </div>
            <CardDescription>Set default values for proforma calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="default_vacancy">Default Vacancy Rate (%)</Label>
                <Input
                  id="default_vacancy"
                  type="number"
                  value={defaults.vacancy_rate}
                  onChange={(e) => setDefaults({ ...defaults, vacancy_rate: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_mgmt">Property Mgmt Fee (%)</Label>
                <Input
                  id="default_mgmt"
                  type="number"
                  value={defaults.mgmt_fee}
                  onChange={(e) => setDefaults({ ...defaults, mgmt_fee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_maintenance">Maintenance Reserve (%)</Label>
                <Input
                  id="default_maintenance"
                  type="number"
                  value={defaults.maintenance_reserve}
                  onChange={(e) => setDefaults({ ...defaults, maintenance_reserve: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="default_appreciation">Appreciation Rate (%)</Label>
                <Input
                  id="default_appreciation"
                  type="number"
                  value={defaults.appreciation_rate}
                  onChange={(e) => setDefaults({ ...defaults, appreciation_rate: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_rent_growth">Rent Growth Rate (%)</Label>
                <Input
                  id="default_rent_growth"
                  type="number"
                  value={defaults.rent_growth_rate}
                  onChange={(e) => setDefaults({ ...defaults, rent_growth_rate: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_interest">Default Interest Rate (%)</Label>
                <Input
                  id="default_interest"
                  type="number"
                  step="0.125"
                  value={defaults.interest_rate}
                  onChange={(e) => setDefaults({ ...defaults, interest_rate: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button onClick={handleSaveDefaults} disabled={savingDefaults}>
              {savingDefaults ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : defaultsSaved ? (
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              ) : null}
              {defaultsSaved ? 'Saved!' : 'Save Defaults'}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>Export and manage your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Export Properties (CSV)</Button>
              <Button variant="outline">Export Transactions (CSV)</Button>
              <Button variant="outline">Export All Data</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

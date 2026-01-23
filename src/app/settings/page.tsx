'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, User, Bell, Database } from 'lucide-react';

export default function SettingsPage() {
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
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company / LLC Name</Label>
              <Input id="company" placeholder="Murray Aspinwall LP" defaultValue="Murray Aspinwall LP" />
            </div>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="lease" defaultChecked className="h-4 w-4 rounded border-gray-300" />
              <div className="space-y-0.5">
                <Label htmlFor="lease">Lease Expiration Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified 30/60/90 days before lease expires
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="maintenance" defaultChecked className="h-4 w-4 rounded border-gray-300" />
              <div className="space-y-0.5">
                <Label htmlFor="maintenance">Maintenance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications for pending maintenance items
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="payment" className="h-4 w-4 rounded border-gray-300" />
              <div className="space-y-0.5">
                <Label htmlFor="payment">Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Upcoming rent collection reminders
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">
              Note: Email notifications coming soon
            </p>
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
                <Input id="default_vacancy" type="number" defaultValue="5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_mgmt">Property Mgmt Fee (%)</Label>
                <Input id="default_mgmt" type="number" defaultValue="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_maintenance">Maintenance Reserve (%)</Label>
                <Input id="default_maintenance" type="number" defaultValue="5" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="default_appreciation">Appreciation Rate (%)</Label>
                <Input id="default_appreciation" type="number" defaultValue="3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_rent_growth">Rent Growth Rate (%)</Label>
                <Input id="default_rent_growth" type="number" defaultValue="2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_interest">Default Interest Rate (%)</Label>
                <Input id="default_interest" type="number" step="0.125" defaultValue="7" />
              </div>
            </div>
            <Button>Save Defaults</Button>
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Search,
  ArrowRight,
  Home,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// Demo data - replace with real data from Supabase
const stats = {
  totalEquity: 125000,
  monthlyCashFlow: 850,
  portfolioValue: 425000,
  activeProspects: 3,
  properties: 1,
  cashOnCash: 8.2,
};

const recentProspects = [
  {
    id: '1',
    address: '123 Main St',
    city: 'Columbus',
    list_price: 185000,
    status: 'researching',
  },
  {
    id: '2',
    address: '456 Oak Ave',
    city: 'Dublin',
    list_price: 245000,
    status: 'offer_made',
  },
];

const upcomingTasks = [
  { id: '1', task: 'Lease renewal due', property: '789 Elm St', date: '2024-02-15' },
  { id: '2', task: 'HVAC maintenance scheduled', property: '789 Elm St', date: '2024-02-20' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your rental property portfolio and prospects
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.portfolioValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.properties} active property
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalEquity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${stats.monthlyCashFlow.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.cashOnCash}% Cash-on-Cash
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prospects</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProspects}</div>
            <p className="text-xs text-muted-foreground">
              Properties under review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Prospects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Prospects</CardTitle>
              <CardDescription>Properties you are researching</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/prospects">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProspects.length > 0 ? (
              <div className="space-y-4">
                {recentProspects.map((prospect) => (
                  <div
                    key={prospect.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{prospect.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {prospect.city} - ${prospect.list_price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        prospect.status === 'offer_made' ? 'default' : 'secondary'
                      }
                    >
                      {prospect.status === 'offer_made' ? 'Offer Made' : 'Researching'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No prospects yet
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/prospects/search">Search Properties</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Lease renewals and maintenance</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/properties">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{task.task}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.property}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(task.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No upcoming tasks
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/prospects/search">
              <Search className="h-6 w-6" />
              <span>Search Properties</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/calculator">
              <DollarSign className="h-6 w-6" />
              <span>Run Proforma</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/banking/import">
              <TrendingUp className="h-6 w-6" />
              <span>Import Transactions</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/properties">
              <Building2 className="h-6 w-6" />
              <span>View Portfolio</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

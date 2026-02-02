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
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getRecentProspects, getUpcomingTasks, getBankAccounts } from '@/lib/database';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, recentProspects, upcomingTasks, bankAccounts] = await Promise.all([
    getDashboardStats(),
    getRecentProspects(5),
    getUpcomingTasks(),
    getBankAccounts(),
  ]);

  const totalCashBalance = bankAccounts.reduce(
    (sum, account) => sum + (account.current_balance || 0),
    0
  );

  const cashOnCash = stats.totalEquity > 0
    ? ((stats.monthlyCashFlow * 12) / stats.totalEquity * 100).toFixed(1)
    : '0.0';

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              {stats.totalProperties} active {stats.totalProperties === 1 ? 'property' : 'properties'}
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
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCashBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {bankAccounts.length} {bankAccounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.monthlyCashFlow >= 0 ? '+' : ''}${stats.monthlyCashFlow.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {cashOnCash}% Cash-on-Cash
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
                  <Link
                    key={prospect.id}
                    href={`/prospects/${prospect.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{prospect.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {prospect.city}, {prospect.state} - ${(prospect.list_price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={prospect.status === 'offer_made' ? 'default' : 'secondary'}
                    >
                      {prospect.status === 'offer_made' ? 'Offer Made' : 'Researching'}
                    </Badge>
                  </Link>
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

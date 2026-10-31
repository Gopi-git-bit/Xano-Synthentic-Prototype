import { Badge, Card, EmptyState, Notice, PageIntro } from './components';
import CRM from './CRM';

function RestrictedCard({ title, description, action }: { title: string; description: string; action: string }) {
  return <Card title={title} action={<Badge>Unavailable</Badge>}>
    <div className="px-5 pb-5">
      <EmptyState title={action}>{description}</EmptyState>
    </div>
  </Card>;
}

// These workspaces deliberately have no operational data adapter.
// A signed-in account is not evidence that trip, fleet, POD or finance permissions are released.
export function VehicleOwnerRestricted({ role }: { role: string }) {
  const driver = role === 'driver';
  return <>
    <PageIntro title={driver ? 'Your assigned work.' : 'Your fleet workspace.'}
      subtitle={driver ? 'Driver access is separate from vehicle-owner management and settlement permissions.' : 'Vehicle-owner access is separate from customer booking and platform administration.'}
      eyebrow="VEHICLE OWNER · RESTRICTED ACCESS"/>
    <div className="mb-5"><Notice>Assignment and vehicle inventory APIs have not passed read authorization and publication checks. No trip, location, earnings or customer records are loaded here. All operational actions remain unavailable.</Notice></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <RestrictedCard title="Assigned trips" action="Assignment reads unavailable"
        description="Only verified, assigned trip records will appear after a role- and organization-scoped read contract is approved. Accept, decline, start and finish actions remain disabled."/>
      <RestrictedCard title="Delivery evidence" action="POD service unavailable"
        description="You can review evidence requirements after the verified service is connected. No document, photo or signature is uploaded or marked verified."/>
      <RestrictedCard title={driver ? 'Driver availability' : 'Fleet availability'} action="Live fleet status unavailable"
        description="Vehicle location, online/offline status and availability are not connected. The screen does not infer an assignment or show sample tracking."/>
      <RestrictedCard title="Financial visibility" action="Earnings and settlements restricted"
        description={driver ? 'Driver accounts cannot access fleet-owner earnings or customer payment details.' : 'Settlements require separate finance authorization and verified read contracts. No payout or payment data is displayed.'}/>
    </div>
  </>;
}

export function AdminRestricted() {
  return <>
    <PageIntro title="Operations oversight." subtitle="Platform administration does not bypass customer, driver or finance record permissions." eyebrow="ADMIN · RESTRICTED ACCESS"/>
    <div className="mb-5"><Notice>Admin order, fleet, dispatch and finance read contracts have not been independently verified or released. No operational records or totals are loaded, and no actions can be submitted.</Notice></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <RestrictedCard title="Orders and dispatch" action="Control tower unavailable"
        description="Order totals, assignments, live tracking and operational exceptions require a separately authorized administrative read API."/>
      <RestrictedCard title="Finance and compliance" action="Finance records unavailable"
        description="Payments, settlements, refunds and approval actions are blocked. Refund execution always requires independent human authorization."/>
    </div>
    <div className="mt-7"><CRM preview={false}/></div>
  </>;
}

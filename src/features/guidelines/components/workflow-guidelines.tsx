"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAssessmentRubric } from "@/features/tasks/task-ai-result.query";
import { useAuth } from "@/providers/auth-provider";
import { permissionRows, statusTransitions, workflowSteps, roleGuides } from "../guideline.constants";

export function WorkflowGuidelines() {
  const rubric = useAssessmentRubric();
  const { user } = useAuth();
  const role = user?.role ?? "MEMBER";
  return (
    <div className="space-y-6">
      <PageHeader title="Guideline & Flow" description="Understand the workflow and assessment guidelines."
        actions={user && <Badge variant="outline">{user.role}</Badge>} />
      <Card>
        <CardHeader>
          <CardTitle><span className="system-copy">End-to-end workflow</span></CardTitle>
          <CardDescription>Project → Task → Checklists, Evidence, Status History and AI Results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <li key={step.title} className="space-y-2 rounded-lg border-2 border-border bg-muted/30 p-4">
                <span className="font-mono text-xs text-muted-foreground">STEP {String(index + 1).padStart(2, "0")}</span>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{role === "ADMIN" ? step.admin : step.member}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground"><span className="system-copy">Changelogs are created independently for each project, not automatically from completed tasks.</span></p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{role === "ADMIN" ? "Admin" : "Member"} workspace guide</CardTitle><CardDescription>Available pages and responsibilities for your role.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 [&>section:last-child:nth-child(odd)]:sm:col-span-2">{roleGuides[role].map(item => <section key={item.title} className="space-y-1 rounded-md border-2 border-border bg-muted/30 p-3"><h3 className="font-bold">{item.title}</h3><p className="text-sm text-muted-foreground">{item.description}</p></section>)}</CardContent>
      </Card>
      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle><span className="system-copy">Task lifecycle</span></CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>From</TableHead><TableHead>Action</TableHead><TableHead>To</TableHead></TableRow></TableHeader>
              <TableBody>{statusTransitions.map((row) => (
                <TableRow key={row.action}>
                  <TableCell><Badge variant="outline">{row.from}</Badge></TableCell>
                  <TableCell className="whitespace-normal">{row.action}</TableCell>
                  <TableCell><Badge variant="outline">{row.to}</Badge></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><span className="system-copy">AI assessment</span></CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>INITIAL:</strong> Triggered when a task is created. Estimates workload.</p>
            <p><strong>FINAL:</strong> Triggered only after admin approval. Determines the official score.</p>
            <p><span className="system-copy">Both assessments use title, description and checklist snapshots; evidence is for human verification only.</span></p>
            <p><span className="system-copy">Submitting evidence does not trigger an AI assessment. Failed INITIAL assessments can be retried by the assignee or admin while the project is active and the task is not DONE. If FINAL fails, the task stays PENDING and an admin can retry after approval.</span></p>
            <div className="rounded-lg border-2 border-border bg-muted/30 p-3">
              INITIAL: 5 pts → FINAL: 8 pts → official score: <strong>8 pts</strong>, not 13 pts.
            </div>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle><span className="system-copy">Evidence and approval</span></CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="system-copy">Attach verifiable results before submitting a task.</span></p>
            <ul className="list-disc space-y-1 pl-5">
              <li>GitHub commit or pull request links.</li>
              <li>Experiment screenshots or test results.</li>
              <li>PDF reports, documents or spreadsheets.</li>
            </ul>
            <p><span className="system-copy">Evidence is managed only in My Focus by the assignee. The current Task Management inspector hides evidence attachments, although approval requires at least one evidence item. An admin can request revision with a reason or approve another assignee’s task. Pending and completed tasks are locked for normal editing; inactive projects cannot be used for task execution.</span></p>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle><span className="system-copy">Access permissions</span></CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Admin</TableHead><TableHead>Member</TableHead></TableRow></TableHeader>
              <TableBody>{permissionRows.map((row) => (
                <TableRow key={row.action}>
                  <TableCell className="whitespace-normal">{row.action}</TableCell>
                  <TableCell className="whitespace-normal">{row.admin}</TableCell><TableCell className="whitespace-normal">{row.member}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground"><span className="system-copy">*The current checklist UI exposes removal for the assignee, but the mock API still restricts deletion to admins. Permissions here describe the current application, not a verified production backend.</span></p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle><span className="system-copy">Assessment rubric</span></CardTitle><CardDescription>Points represent task complexity and scope.</CardDescription></CardHeader>
        <CardContent>
          {rubric.isError ? (
            <div role="alert" className="space-y-3 text-sm">
              <p className="text-destructive"><span className="system-copy">Unable to load assessment rubric.</span></p>
              <Button variant="outline" onClick={() => void rubric.refetch()}>Retry</Button>
            </div>
          ) : rubric.isPending ? (
            <p role="status" className="text-sm text-muted-foreground"><span className="system-copy">Loading assessment rubric...</span></p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Tier</TableHead><TableHead>Points</TableHead><TableHead>Criteria</TableHead></TableRow></TableHeader>
              <TableBody>{rubric.data.map((item) => (
                <TableRow key={item.tier}>
                  <TableCell><Badge variant="outline">{item.tier}</Badge></TableCell>
                  <TableCell className="font-bold tabular-nums">{item.points}</TableCell>
                  <TableCell className="whitespace-normal">{item.description}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
          {!rubric.isPending && !rubric.isError && rubric.data.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground"><span className="system-copy">No rubric configured.</span></p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

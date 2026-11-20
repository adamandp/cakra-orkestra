"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAssessmentRubric } from "@/features/tasks/task-ai-result.query";
import { useAuth } from "@/providers/auth-provider";
import { permissionRows, statusTransitions, workflowSteps } from "../guideline.constants";

export function WorkflowGuidelines() {
  const rubric = useAssessmentRubric();
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader title="Guideline & Flow" description="Understand the workflow and assessment guidelines."
        actions={user && <Badge variant="outline">{user.role}</Badge>} />
      <Card>
        <CardHeader>
          <CardTitle>End-to-end workflow</CardTitle>
          <CardDescription>Project → Task → Checklists, Evidence, Status History and AI Results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <li key={step.title} className="space-y-2 rounded-lg border-2 border-border bg-muted/30 p-4">
                <span className="font-mono text-xs text-muted-foreground">STEP {String(index + 1).padStart(2, "0")}</span>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground">Changelogs are created independently for each project, not automatically from completed tasks.</p>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Task lifecycle</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>AI assessment</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>INITIAL:</strong> Triggered when a task is created. Estimates workload.</p>
            <p><strong>FINAL:</strong> Triggered only after admin approval. Determines the official score.</p>
            <p>Both assessments use title, description and checklist snapshots; evidence is for human verification only.</p>
            <p>Submitting evidence does not trigger an AI assessment. If the final assessment fails, the task stays PENDING and can be retried by an admin.</p>
            <div className="rounded-lg border-2 border-border bg-muted/30 p-3">
              INITIAL: 5 pts → FINAL: 8 pts → official score: <strong>8 pts</strong>, not 13 pts.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Evidence and approval</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Attach verifiable results before submitting a task.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>GitHub commit or pull request links.</li>
              <li>Experiment screenshots or test results.</li>
              <li>PDF reports, documents or spreadsheets.</li>
            </ul>
            <p>Evidence types are not restricted by role. Admin can request revision with a reason or approve the task. Tasks remain locked while awaiting approval or final assessment.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Access permissions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Admin</TableHead><TableHead>Member</TableHead></TableRow></TableHeader>
              <TableBody>{permissionRows.map((row) => (
                <TableRow key={row.action}>
                  <TableCell className="whitespace-normal">{row.action}</TableCell>
                  <TableCell>{row.admin}</TableCell><TableCell>{row.member}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Assessment rubric</CardTitle><CardDescription>Points represent task complexity and scope.</CardDescription></CardHeader>
        <CardContent>
          {rubric.isError ? (
            <div role="alert" className="space-y-3 text-sm">
              <p className="text-destructive">Unable to load assessment rubric.</p>
              <Button variant="outline" onClick={() => void rubric.refetch()}>Retry</Button>
            </div>
          ) : rubric.isPending ? (
            <p role="status" className="text-sm text-muted-foreground">Loading assessment rubric...</p>
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
            <p className="py-4 text-center text-sm text-muted-foreground">No rubric configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

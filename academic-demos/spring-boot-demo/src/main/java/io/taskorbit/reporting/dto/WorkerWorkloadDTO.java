package io.taskorbit.reporting.dto;

/**
 * WorkerWorkloadDTO — Workload reporting summary for workers.
 */
public class WorkerWorkloadDTO {

    private String workerId;
    private String workerName;
    private int totalAssignedTasks;
    private int activeTasks;
    private int inReviewTasks;
    private int approvedTasks;
    private boolean hasActiveConflicts;

    public WorkerWorkloadDTO() {
    }

    public WorkerWorkloadDTO(String workerId, String workerName, int totalAssignedTasks,
                             int activeTasks, int inReviewTasks, int approvedTasks,
                             boolean hasActiveConflicts) {
        this.workerId = workerId;
        this.workerName = workerName;
        this.totalAssignedTasks = totalAssignedTasks;
        this.activeTasks = activeTasks;
        this.inReviewTasks = inReviewTasks;
        this.approvedTasks = approvedTasks;
        this.hasActiveConflicts = hasActiveConflicts;
    }

    public String getWorkerId() {
        return workerId;
    }

    public void setWorkerId(String workerId) {
        this.workerId = workerId;
    }

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }

    public int getTotalAssignedTasks() {
        return totalAssignedTasks;
    }

    public void setTotalAssignedTasks(int totalAssignedTasks) {
        this.totalAssignedTasks = totalAssignedTasks;
    }

    public int getActiveTasks() {
        return activeTasks;
    }

    public void setActiveTasks(int activeTasks) {
        this.activeTasks = activeTasks;
    }

    public int getInReviewTasks() {
        return inReviewTasks;
    }

    public void setInReviewTasks(int inReviewTasks) {
        this.inReviewTasks = inReviewTasks;
    }

    public int getApprovedTasks() {
        return approvedTasks;
    }

    public void setApprovedTasks(int approvedTasks) {
        this.approvedTasks = approvedTasks;
    }

    public boolean isHasActiveConflicts() {
        return hasActiveConflicts;
    }

    public void setHasActiveConflicts(boolean hasActiveConflicts) {
        this.hasActiveConflicts = hasActiveConflicts;
    }
}

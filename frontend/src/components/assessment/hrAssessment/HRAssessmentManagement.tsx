import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { assessmentService, skillService, userService, teamService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  AssessmentWithHistory,
  AssessmentStatus,
  AssessmentCycle,
} from "@/types/assessmentTypes";

import { UserHistoryModal } from "./modals/userHistoryModel";
import { ScoreHistoryModal } from "./modals/scoreHistoryModel";
import { HRReviewModal } from "./modals/hrReviewModel";
import { BulkAssessmentModal } from "./modals/bulkAssessmentModel";
import { OverdueDetailsModal } from "./modals/overdueDetailsModal";
//import { InitiateAssessmentModal } from "./initiateAssessmentModel";
import { PendingReviewsTab } from "./page/pendingReviewsTab";
import { AssessmentsTab } from "./page/assessmentsTab";
import { CyclesTab } from "./page/cyclesTab";
import { OverviewTab } from "./page/overviewTab";

interface User {
  id: string;
  name: string;
  email: string;
  role?: {
    id: number;
    name: string;
  };
  Team?: {
    id: number;
    name: string;
  };
}

interface Team {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
}

const HRAssessmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
  const [userSummaries, setUserSummaries] = useState<any[]>([]);
  const [cycles, setCycles] = useState<AssessmentCycle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState<AssessmentWithHistory[]>([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [showScoreHistoryModal, setShowScoreHistoryModal] = useState(false);
  const [showOverdueDetailsModal, setShowOverdueDetailsModal] = useState(false);
  const [overdueAssessments, setOverdueAssessments] = useState<any[]>([]);
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk selection states
  const [selectedAssessments, setSelectedAssessments] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkReviewModal, setShowBulkReviewModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');
  const [bulkComments, setBulkComments] = useState("");

  // Form states
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduleType, setScheduleType] = useState("QUARTERLY");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [comments, setComments] = useState("");

  // Bulk assessment states
  const [bulkTitle, setBulkTitle] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [excludedUsers, setExcludedUsers] = useState<string[]>([]);
  const [bulkScheduleType, setBulkScheduleType] = useState("QUARTERLY");
  const [bulkDeadlineDate, setBulkDeadlineDate] = useState("");

  // Helper function to get default deadline date (7 days from now)
  const getDefaultDeadlineDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  useEffect(() => {
    if (user?.role?.name === "hr") {
      loadHRData();
      // Set default deadline dates
      if (!deadlineDate) setDeadlineDate(getDefaultDeadlineDate());
      if (!bulkDeadlineDate) setBulkDeadlineDate(getDefaultDeadlineDate());
    }
  }, [user]);

  const loadHRData = async () => {
    setIsLoading(true);
    try {
      const [assessmentsRes, userSummariesRes, cyclesRes, usersRes, teamsRes, skillsRes] = await Promise.all([
        assessmentService.getAssessmentsForRole(),
        assessmentService.getUserAssessmentSummaries(),
        assessmentService.getAssessmentCycles(),
        userService.getAllUsers(),
        teamService.getAllTeams(),
        skillService.getAllSkills(),
      ]);

      if (assessmentsRes?.success !== false) setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : assessmentsRes?.data || []);
      if (userSummariesRes?.success !== false) setUserSummaries(Array.isArray(userSummariesRes) ? userSummariesRes : userSummariesRes?.data || []);
      if (cyclesRes?.success !== false) setCycles(Array.isArray(cyclesRes) ? cyclesRes : cyclesRes?.data || []);
      if (usersRes?.success !== false) {
        // Filter out HR users
        const usersData = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
        console.log("Users data:", usersData); // Debug log
        const nonHRUsers = usersData.filter((u: User) => u.role?.name !== "hr");
        setUsers(nonHRUsers);
      }
      if (teamsRes?.success !== false) setTeams(Array.isArray(teamsRes) ? teamsRes : teamsRes?.data || []);
      if (skillsRes?.success !== false) setSkills(Array.isArray(skillsRes) ? skillsRes : skillsRes?.data || []);
    } catch (error) {
      console.error("Error loading HR data:", error);
      toast({
        title: "Error",
        description: "Failed to load assessment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED:
        return "bg-blue-100 text-blue-800";
      case AssessmentStatus.LEAD_WRITING:
        return "bg-yellow-100 text-yellow-800";
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return "bg-purple-100 text-purple-800";
      case AssessmentStatus.EMPLOYEE_APPROVED:
        return "bg-green-100 text-green-800";
      case AssessmentStatus.EMPLOYEE_REJECTED:
        return "bg-red-100 text-red-800";
      case AssessmentStatus.HR_FINAL_REVIEW:
        return "bg-indigo-100 text-indigo-800";
      case AssessmentStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case AssessmentStatus.CANCELLED:
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInitiateAssessment = async () => {
    if (!selectedUser || selectedSkills.length === 0) {
      toast({
        title: "Error",
        description: "Please select a user and at least one skill",
        variant: "destructive",
      });
      return;
    }

    if (!deadlineDate) {
      toast({
        title: "Error",
        description: "Please select a deadline date",
        variant: "destructive",
      });
      return;
    }

    const deadline = new Date(deadlineDate);
    const now = new Date();
    if (deadline <= now) {
      toast({
        title: "Error",
        description: "Deadline must be in the future",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate deadline days from now
      const deadlineDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const response = await assessmentService.initiateAssessment({
        targetUserId: selectedUser,
        skillIds: selectedSkills,
        scheduledDate: scheduledDate || undefined,
        scheduleType,
        deadlineDays,
        comments,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Assessment initiated successfully",
        });
        setShowInitiateModal(false);
        resetForm();
        loadHRData();
      }
    } catch (error) {
      console.error("Error initiating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkInitiate = async () => {
    if (!bulkTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a title",
        variant: "destructive",
      });
      return;
    }

    if (!bulkDeadlineDate) {
      toast({
        title: "Error",
        description: "Please select a deadline date",
        variant: "destructive",
      });
      return;
    }

    const deadline = new Date(bulkDeadlineDate);
    const now = new Date();
    if (deadline <= now) {
      toast({
        title: "Error",
        description: "Deadline must be in the future",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate deadline days from now
      const deadlineDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const response = await assessmentService.initiateBulkAssessment({
        assessmentTitle: bulkTitle,
        includeTeams: selectedTeams.length > 0 ? selectedTeams : ["all"],
        scheduledDate: scheduledDate || undefined,
        scheduleType: bulkScheduleType,
        deadlineDays,
        comments,
        excludeUsers: excludedUsers,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Initiate assessment initiated for ${response.data.totalAssessments} users`,
        });
        setShowBulkModal(false);
        resetBulkForm();
        loadHRData();
      }
    } catch (error) {
      console.error("Error initiating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHRReview = async (approved: boolean) => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);
    try {
      const response = await assessmentService.hrFinalReview(
        selectedAssessment.id,
        { approved, comments: reviewComments }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Assessment ${approved ? "approved" : "rejected"} successfully`,
        });
        setShowReviewModal(false);
        loadHRData();
      }
    } catch (error) {
      console.error("Error submitting HR review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAssessments(new Set());
      setSelectAll(false);
    } else {
      const pendingHRReviews = assessments.filter(a => 
        a.status === AssessmentStatus.EMPLOYEE_APPROVED || 
        a.status === AssessmentStatus.HR_FINAL_REVIEW
      );
      const allIds = new Set(pendingHRReviews.map(assessment => assessment.id));
      setSelectedAssessments(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectAssessment = (assessmentId: number) => {
    const newSelected = new Set(selectedAssessments);
    if (newSelected.has(assessmentId)) {
      newSelected.delete(assessmentId);
    } else {
      newSelected.add(assessmentId);
    }
    setSelectedAssessments(newSelected);
    
    const pendingHRReviews = assessments.filter(a => 
      a.status === AssessmentStatus.EMPLOYEE_APPROVED || 
      a.status === AssessmentStatus.HR_FINAL_REVIEW
    );
    setSelectAll(newSelected.size === pendingHRReviews.length);
  };

  const handleBulkReview = async () => {
    if (selectedAssessments.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one assessment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await assessmentService.hrBulkFinalReview({
        assessmentIds: Array.from(selectedAssessments),
        approved: bulkAction === 'approve',
        comments: bulkComments
      });

      if (response.success || response.successful !== undefined) {
        const result = response.data || response;
        toast({
          title: "Bulk Review Completed",
          description: `${result.successful} assessments processed successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
        setShowBulkReviewModal(false);
        setSelectedAssessments(new Set());
        setSelectAll(false);
        setBulkComments("");
        loadHRData();
      }
    } catch (error) {
      console.error("Error submitting bulk review:", error);
      toast({
        title: "Error",
        description: "Failed to submit bulk review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowScoreHistory = async (assessmentId: number) => {
    try {
      const response = await assessmentService.getAssessmentScoreHistory(assessmentId);
      if (response?.success !== false) {
        const historyData = Array.isArray(response) ? response : response?.data || [];
        setScoreHistory(historyData);
        setShowScoreHistoryModal(true);
      } else {
        throw new Error(response?.error || "Failed to load score history");
      }
    } catch (error) {
      console.error("Error loading score history:", error);
      toast({
        title: "Error",
        description: "Failed to load score change history",
        variant: "destructive",
      });
    }
  };

  const handleShowOverdueDetails = (assessments: any[]) => {
    // Convert assessments to the format expected by the modal
    const overdueData = assessments.map(assessment => ({
      user: assessment.user,
      latestAssessment: assessment
    }));
    setOverdueAssessments(overdueData);
    setShowOverdueDetailsModal(true);
  };

  const handleShowUserHistory = async (userId: string, userName: string) => {
    try {
      setSelectedUserName(userName);
      setIsLoading(true);
      const response = await assessmentService.getUserAssessmentHistory(userId);
      if (response?.success !== false) {
        const historyData = Array.isArray(response) ? response : response?.data || [];
        setSelectedUserHistory(historyData);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error("Error loading user history:", error);
      toast({
        title: "Error",
        description: "Failed to load user assessment history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser("");
    setSelectedSkills([]);
    setScheduledDate("");
    setScheduleType("QUARTERLY");
    setDeadlineDate(getDefaultDeadlineDate());
    setComments("");
  };

  const resetBulkForm = () => {
    setBulkTitle("");
    setSelectedTeams([]);
    setSelectedSkills([]);
    setExcludedUsers([]);
    setScheduledDate("");
    setBulkScheduleType("QUARTERLY");
    setBulkDeadlineDate(getDefaultDeadlineDate());
    setComments("");
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingHRReviews = assessments.filter(a => 
    a.status === AssessmentStatus.EMPLOYEE_APPROVED || 
    a.status === AssessmentStatus.HR_FINAL_REVIEW
  );

  // Helper function to check if assessment is overdue
  const isOverdue = (assessment: AssessmentWithHistory) => {
    if (!assessment?.deadlineDate) return false;
    const deadline = new Date(assessment.deadlineDate);
    const now = new Date();
    return deadline < now && !['COMPLETED', 'CANCELLED'].includes(assessment.status);
  };

  const currentOverdueAssessments = assessments.filter(assessment => isOverdue(assessment));

  const statistics = {
    total: assessments.length,
    pending: assessments.filter(a => a.status !== AssessmentStatus.COMPLETED && a.status !== AssessmentStatus.CANCELLED).length,
    completed: assessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
    hrReviews: pendingHRReviews.length,
    overdue: currentOverdueAssessments.length,
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "assessments", label: "All Assessments", icon: FileText },
    { id: "cycles", label: "Assessment Cycles", icon: Calendar },
    { id: "pending-reviews", label: "HR Reviews", icon: AlertCircle, count: pendingHRReviews.length },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Assessment Management</h1>
        </div>
        <div className="mb-5 flex gap-3">
          {/* <button
            onClick={() => {
              if (users.length === 0 || skills.length === 0) {
                toast({
                  title: "Error",
                  description: "Please wait for data to load before initiating assessment",
                  variant: "destructive",
                });
                return;
              }
              setShowInitiateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Initiate Assessment
          </button> */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Initiate Assessment
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Pending HR Review</p>
              <p className="text-2xl font-bold text-red-600">{statistics.hrReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => statistics.overdue > 0 && handleShowOverdueDetails(currentOverdueAssessments)}>
          <div className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-700" />
            <div>
              <p className="text-sm text-gray-600">Overdue Assessments</p>
              <p className="text-2xl font-bold text-red-700">{statistics.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-5 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    selectedTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content will be added here */}
          {selectedTab === "overview" && (
            <OverviewTab assessments={assessments} cycles={cycles} statistics={statistics} />
          )}
          
          {selectedTab === "assessments" && (
            <AssessmentsTab
              userSummaries={userSummaries}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              onShowHistory={handleShowUserHistory}
              onShowOverdueDetails={() => handleShowOverdueDetails(currentOverdueAssessments)}
            />
          )}

          {selectedTab === "cycles" && (
            <CyclesTab cycles={cycles} formatDate={formatDate} />
          )}

          {selectedTab === "pending-reviews" && (
            <PendingReviewsTab
              pendingReviews={pendingHRReviews}
              onReview={(assessment) => {
                setSelectedAssessment(assessment);
                setReviewComments("");
                setShowReviewModal(true);
              }}
              onShowHistory={handleShowUserHistory}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              selectedAssessments={selectedAssessments}
              selectAll={selectAll}
              onSelectAll={handleSelectAll}
              onSelectAssessment={handleSelectAssessment}
              onBulkAction={(action) => {
                setBulkAction(action);
                setShowBulkReviewModal(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {/* {showInitiateModal && users.length > 0 && skills.length > 0 && (
        <InitiateAssessmentModal
          users={users}
          skills={skills}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          scheduleType={scheduleType}
          setScheduleType={setScheduleType}
          deadlineDays={deadlineDays}
          setDeadlineDays={setDeadlineDays}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleInitiateAssessment}
          onClose={() => setShowInitiateModal(false)}
        />
      )} */}

      {showBulkModal && (
        <BulkAssessmentModal
          teams={teams}
          users={users}
          bulkTitle={bulkTitle}
          setBulkTitle={setBulkTitle}
          selectedTeams={selectedTeams}
          setSelectedTeams={setSelectedTeams}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
          excludedUsers={excludedUsers}
          setExcludedUsers={setExcludedUsers}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          scheduleType={bulkScheduleType}
          setScheduleType={setBulkScheduleType}
          deadlineDate={bulkDeadlineDate}
          setDeadlineDate={setBulkDeadlineDate}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleBulkInitiate}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {showReviewModal && selectedAssessment && (
        <HRReviewModal
          assessment={selectedAssessment}
          comments={reviewComments}
          setComments={setReviewComments}
          isSubmitting={isSubmitting}
          onSubmit={handleHRReview}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {showBulkReviewModal && (
        <BulkReviewModal
          selectedCount={selectedAssessments.size}
          action={bulkAction}
          comments={bulkComments}
          setComments={setBulkComments}
          isSubmitting={isSubmitting}
          onSubmit={handleBulkReview}
          onClose={() => setShowBulkReviewModal(false)}
        />
      )}

      {showHistoryModal && (
        <UserHistoryModal
          userName={selectedUserName}
          assessmentHistory={selectedUserHistory}
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedUserHistory([]);
            setSelectedUserName("");
          }}
          onShowScoreHistory={handleShowScoreHistory}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
        />
      )}

      {showScoreHistoryModal && (
        <ScoreHistoryModal
          scoreHistory={scoreHistory}
          isOpen={showScoreHistoryModal}
          onClose={() => {
            setShowScoreHistoryModal(false);
            setScoreHistory([]);
          }}
          formatDate={formatDate}
        />
      )}

      {showOverdueDetailsModal && (
        <OverdueDetailsModal
          overdueAssessments={overdueAssessments}
          formatDate={formatDate}
          onClose={() => {
            setShowOverdueDetailsModal(false);
            setOverdueAssessments([]);
          }}
        />
      )}
    </div>
  );
};

// Tab Components
// const OverviewTab: React.FC<{
//   assessments: AssessmentWithHistory[];
//   cycles: AssessmentCycle[];
//   statistics: any;
// }> = ({ assessments, cycles, statistics }) => {
//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Recent Activity */}
//         <div className="bg-gray-50 rounded-lg p-6">
//           <h3 className="text-lg font-medium mb-4">Recent Assessment Activity</h3>
//           <div className="space-y-3">
//             {assessments.slice(0, 5).map((assessment) => (
//               <div key={assessment.id} className="flex items-center justify-between">
//                 <div>
//                   <p className="font-medium">{assessment.user?.name}</p>
//                   <p className="text-sm text-gray-500">Assessment #{assessment.id}</p>
//                 </div>
//                 <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                   {assessment.status.replace('_', ' ')}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Active Cycles */}
//         <div className="bg-gray-50 rounded-lg p-6">
//           <h3 className="text-lg font-medium mb-4">Active Assessment Cycles</h3>
//           <div className="space-y-3">
//             {cycles.filter(c => c.status === "ACTIVE").slice(0, 5).map((cycle) => (
//               <div key={cycle.id} className="flex items-center justify-between">
//                 <div>
//                   <p className="font-medium">{cycle.title}</p>
//                   <p className="text-sm text-gray-500">{cycle.totalAssessments} assessments</p>
//                 </div>
//                 <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
//                   {cycle.status}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const AssessmentsTab: React.FC<{
//   userSummaries: any[];
//   searchTerm: string;
//   setSearchTerm: (term: string) => void;
//   statusFilter: string;
//   setStatusFilter: (status: string) => void;
//   getStatusColor: (status: AssessmentStatus) => string;
//   formatDate: (date: string | Date) => string;
//   onShowHistory: (userId: string, userName: string) => void;
// }> = ({ userSummaries, searchTerm, setSearchTerm, statusFilter, setStatusFilter, getStatusColor, formatDate, onShowHistory }) => {
//   // Filter user summaries based on search and status
//   const filteredSummaries = userSummaries.filter(summary => {
//     const matchesSearch = summary.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
//     const matchesStatus = statusFilter === "all" || summary.latestAssessment?.status === statusFilter;
//     return matchesSearch && matchesStatus;
//   });

//   return (
//     <div className="space-y-4">
//       {/* Filters */}
//       <div className="flex gap-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search by employee name..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           />
//         </div>
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//         >
//           <option value="all">All Statuses</option>
//           <option value="INITIATED">Initiated</option>
//           <option value="LEAD_WRITING">Lead Writing</option>
//           <option value="EMPLOYEE_REVIEW">Employee Review</option>
//           <option value="EMPLOYEE_APPROVED">Employee Approved</option>
//           <option value="HR_FINAL_REVIEW">HR Review</option>
//           <option value="COMPLETED">Completed</option>
//         </select>
//       </div>

//       {/* User Summaries List - One row per user with latest assessment */}
//       <div className="space-y-4">
//         {filteredSummaries.length === 0 ? (
//           <div className="text-center py-8">
//             <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//             <p className="text-lg text-gray-600">No assessments found</p>
//             <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
//           </div>
//         ) : (
//           filteredSummaries.map((summary) => (
//             <div key={summary.user.id} className="border border-gray-200 rounded-lg p-4">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                     <Users className="h-5 w-5 text-blue-600" />
//                   </div>
//                   <div>
//                     <h4 className="font-medium">{summary.user?.name}</h4>
//                     <p className="text-sm text-gray-500">
//                       {summary.user?.role?.name} 
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(summary.latestAssessment?.status)}`}>
//                     {summary.latestAssessment?.status.replace('_', ' ')}
//                   </span>
//                   <button
//                     onClick={() => onShowHistory(summary.user.id, summary.user.name)}
//                     className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
//                   >
//                     <Clock className="h-4 w-4" />
//                     History
//                   </button>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
//                 <div>
//                   <span className="text-gray-500">Latest Assessment:</span>
//                   <span className="ml-2">{formatDate(summary.latestAssessment?.requestedAt)}</span>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">Current Cycle:</span>
//                   <span className="ml-2">{summary.latestAssessment?.currentCycle}</span>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">Skills Assessed:</span>
//                   <span className="ml-2">{summary.latestAssessment?.detailedScores?.length || 0}</span>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">Total Assessments:</span>
//                   <span className="ml-2 font-medium">{summary.totalAssessments}</span>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">Total Cycles:</span>
//                   <span className="ml-2">{summary.totalCycles}</span>
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// const CyclesTab: React.FC<{
//   cycles: AssessmentCycle[];
//   formatDate: (date: string | Date) => string;
// }> = ({ cycles, formatDate }) => {
//   return (
//     <div className="space-y-4">
//       <h3 className="text-lg font-semibold">Assessment Cycles</h3>
//       <div className="grid grid-cols-1 gap-4">
//         {cycles.map((cycle) => (
//           <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
//             <div className="flex items-center justify-between mb-3">
//               <h4 className="font-medium">{cycle.title}</h4>
//               <span className={`px-2 py-1 rounded text-xs ${
//                 cycle.status === "ACTIVE" ? "bg-green-100 text-green-800" :
//                 cycle.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
//                 "bg-red-100 text-red-800"
//               }`}>
//                 {cycle.status}
//               </span>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
//               <div>
//                 <span className="text-gray-500">Total Assessments:</span>
//                 <span className="ml-2 font-medium">{cycle.totalAssessments}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500">Completed:</span>
//                 <span className="ml-2 font-medium">{cycle.completedAssessments}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500">Created:</span>
//                 <span className="ml-2">{formatDate(cycle.createdAt)}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500">Progress:</span>
//                 <span className="ml-2">{Math.round((cycle.completedAssessments / cycle.totalAssessments) * 100)}%</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// const PendingReviewsTab: React.FC<{
//   pendingReviews: AssessmentWithHistory[];
//   onReview: (assessment: AssessmentWithHistory) => void;
//   onShowHistory: (userId: string, userName: string) => void;
//   getStatusColor: (status: AssessmentStatus) => string;
//   formatDate: (date: string | Date) => string;
// }> = ({ pendingReviews, onReview, onShowHistory, getStatusColor, formatDate }) => {
  
//   const getAssessmentCardColor = (assessment: AssessmentWithHistory) => {
//     // Check if there was a recent employee rejection
//     const hasEmployeeRejection = assessment.history?.some(h => h.auditType === 'EMPLOYEE_REJECTED');
//     const hasHRRejection = assessment.history?.some(h => h.auditType === 'HR_REJECTED');
    
//     if (hasHRRejection) {
//       return 'bg-red-50 border-red-200'; // HR rejection - red
//     } else if (hasEmployeeRejection) {
//       return 'bg-orange-50 border-orange-200'; // Employee rejection - orange
//     } else {
//       return 'bg-yellow-50 border-yellow-200'; // Normal pending - yellow
//     }
//   };

//   const getStatusBadgeColor = (assessment: AssessmentWithHistory) => {
//     const hasEmployeeRejection = assessment.history?.some(h => h.auditType === 'EMPLOYEE_REJECTED');
//     const hasHRRejection = assessment.history?.some(h => h.auditType === 'HR_REJECTED');
    
//     if (hasHRRejection) {
//       return 'bg-red-100 text-red-800';
//     } else if (hasEmployeeRejection) {
//       return 'bg-orange-100 text-orange-800';
//     } else {
//       return 'bg-yellow-100 text-yellow-800';
//     }
//   };
//   if (pendingReviews.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
//         <p className="text-lg text-gray-600">No pending HR reviews</p>
//         <p className="text-sm text-gray-500">All assessments are up to date</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       <h3 className="text-lg font-semibold">Pending HR Reviews</h3>
//       <div className="space-y-4">
//         {pendingReviews.map((assessment) => {
//           const cardColor = getAssessmentCardColor(assessment);
//           const badgeColor = getStatusBadgeColor(assessment);
//           const hasEmployeeRejection = assessment.history?.some(h => h.auditType === 'EMPLOYEE_REJECTED');
//           const hasHRRejection = assessment.history?.some(h => h.auditType === 'HR_REJECTED');
          
//           return (
//             <div key={assessment.id} className={`${cardColor} border rounded-lg p-4`}>
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-3">
//                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//                     hasHRRejection ? 'bg-red-100' : hasEmployeeRejection ? 'bg-orange-100' : 'bg-yellow-100'
//                   }`}>
//                     <AlertCircle className={`h-5 w-5 ${
//                       hasHRRejection ? 'text-red-600' : hasEmployeeRejection ? 'text-orange-600' : 'text-yellow-600'
//                     }`} />
//                   </div>
//                   <div>
//                     <h4 className="font-medium">{assessment.user?.name}</h4>
//                     <p className="text-sm text-gray-500">Assessment #{assessment.id}</p>
//                     {(hasEmployeeRejection || hasHRRejection) && (
//                       <p className="text-xs text-red-600 font-medium">
//                         {hasHRRejection ? 'Previous HR Rejection' : 'Previous Employee Rejection'}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 <span className={`${badgeColor} text-xs font-medium px-2 py-1 rounded-full`}>
//                   {hasHRRejection ? 'HR REJECTED' : hasEmployeeRejection ? 'EMPLOYEE REJECTED' : 'EMPLOYEE APPROVED'}
//                 </span>
//               </div>

//               <div className="mb-4 p-3 bg-white rounded-md border">
//                 <p className="text-sm text-gray-700 mb-2">
//                   <strong>
//                     {hasHRRejection ? 'HR previously rejected - needs revision' : 
//                      hasEmployeeRejection ? 'Employee previously rejected - revised assessment' : 
//                      'Employee has approved the assessment'}
//                   </strong>
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   Skills assessed: {assessment.detailedScores?.length || 0}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   Cycle: {assessment.currentCycle}
//                 </p>
//                 {assessment.rejectionReason && (
//                   <p className="text-sm text-red-600 mt-2">
//                     <strong>Last rejection reason:</strong> {assessment.rejectionReason}
//                   </p>
//                 )}
//               </div>

//               <div className="flex justify-end gap-2">
//                 <button
//                   onClick={() => onShowHistory(assessment.userId, assessment.user?.name || 'Unknown User')}
//                   className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
//                 >
//                   <FileText className="h-4 w-4" />
//                   History
//                 </button>
//                 <button
//                   onClick={() => onReview(assessment)}
//                   className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
//                 >
//                   <Eye className="h-4 w-4" />
//                   Review Assessment
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// Modal Components
// const InitiateAssessmentModal: React.FC<{
//   users: User[];
//   skills: Skill[];
//   selectedUser: string;
//   setSelectedUser: (user: string) => void;
//   selectedSkills: number[];
//   setSelectedSkills: (skills: number[]) => void;
//   scheduledDate: string;
//   setScheduledDate: (date: string) => void;
//   scheduleType: string;
//   setScheduleType: (type: string) => void;
//   deadlineDays: number;
//   setDeadlineDays: (days: number) => void;
//   comments: string;
//   setComments: (comments: string) => void;
//   isSubmitting: boolean;
//   onSubmit: () => void;
//   onClose: () => void;
// }> = ({ 
//   users, 
//   skills, 
//   selectedUser, 
//   setSelectedUser, 
//   selectedSkills, 
//   setSelectedSkills, 
//   scheduledDate, 
//   setScheduledDate, 
//   scheduleType,
//   setScheduleType,
//   deadlineDays,
//   setDeadlineDays,
//   comments, 
//   setComments, 
//   isSubmitting, 
//   onSubmit, 
//   onClose 
// }) => {
//   const handleSkillToggle = (skillId: number) => {
//     setSelectedSkills(
//       selectedSkills.includes(skillId)
//         ? selectedSkills.filter(id => id !== skillId)
//         : [...selectedSkills, skillId]
//     );
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <h2 className="text-xl font-semibold">Initiate Individual Assessment</h2>
//             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//               <XCircle className="h-6 w-6" />
//             </button>
//           </div>
//         </div>

//         <div className="p-6 space-y-6">
//           {/* User Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Select Employee/Team Lead
//             </label>
//             <select
//               value={selectedUser}
//               onChange={(e) => setSelectedUser(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             >
//               <option value="">Choose a user...</option>
//               {users.filter(user => user.name && user.id).map((user) => (
//                 <option key={user.id} value={user.id}>
//                   {user.name} - {user.role?.name || 'Unknown Role'} 
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Skills Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Select Skills to Assess
//             </label>
//             <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
//               <div className="space-y-2">
//                 {skills.filter(skill => skill.name && skill.id).map((skill) => (
//                   <label key={skill.id} className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={selectedSkills.includes(skill.id)}
//                       onChange={() => handleSkillToggle(skill.id)}
//                       className="mr-2"
//                     />
//                     {skill.name}
//                   </label>
//                 ))}
//               </div>
//             </div>
//             <p className="text-sm text-gray-500 mt-1">
//               Selected: {selectedSkills.length} skills
//             </p>
//           </div>

//           {/* Scheduled Date */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Scheduled Date (Optional)
//             </label>
//             <input
//               type="datetime-local"
//               value={scheduledDate}
//               onChange={(e) => setScheduledDate(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           {/* Schedule Type */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Schedule Type
//             </label>
//             <select
//               value={scheduleType}
//               onChange={(e) => setScheduleType(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             >
//               <option value="MONTHLY">Monthly</option>
//               <option value="QUARTERLY">Quarterly</option>
//               <option value="HALF_YEARLY">Half Yearly</option>
//               <option value="YEARLY">Yearly</option>
//             </select>
//             <p className="text-sm text-gray-500 mt-1">
//               Determines when the next assessment will be automatically scheduled
//             </p>
//           </div>

//           {/* Deadline Days */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Deadline (Days to Complete)
//             </label>
//             <input
//               type="number"
//               min="1"
//               max="30"
//               value={deadlineDays}
//               onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//             <p className="text-sm text-gray-500 mt-1">
//               Number of days from initiation to complete the assessment (1-30 days)
//             </p>
//           </div>

//           {/* Comments */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Comments
//             </label>
//             <textarea
//               value={comments}
//               onChange={(e) => setComments(e.target.value)}
//               rows={3}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Add any comments about this assessment..."
//               required
//             />
//           </div>
//         </div>

//         <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//             disabled={isSubmitting}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onSubmit}
//             disabled={isSubmitting || !selectedUser || selectedSkills.length === 0}
//             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
//           >
//             {isSubmitting && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//             )}
//             {isSubmitting ? "Initiating..." : "Initiate Assessment"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const BulkAssessmentModal: React.FC<{
//   teams: Team[];
//   users: User[];
//   bulkTitle: string;
//   setBulkTitle: (title: string) => void;
//   selectedTeams: string[];
//   setSelectedTeams: (teams: string[]) => void;
//   selectedSkills: number[];
//   setSelectedSkills: (skills: number[]) => void;
//   excludedUsers: string[];
//   setExcludedUsers: (users: string[]) => void;
//   scheduledDate: string;
//   setScheduledDate: (date: string) => void;
//   scheduleType: string;
//   setScheduleType: (type: string) => void;
//   deadlineDays: number;
//   setDeadlineDays: (days: number) => void;
//   comments: string;
//   setComments: (comments: string) => void;
//   isSubmitting: boolean;
//   onSubmit: () => void;
//   onClose: () => void;
// }> = ({ 
//   teams, 
//   users, 
//   bulkTitle, 
//   setBulkTitle, 
//   selectedTeams, 
//   setSelectedTeams, 
//   selectedSkills, 
//   setSelectedSkills, 
//   excludedUsers, 
//   setExcludedUsers, 
//   scheduledDate, 
//   setScheduledDate, 
//   scheduleType,
//   setScheduleType,
//   deadlineDays,
//   setDeadlineDays,
//   comments, 
//   setComments, 
//   isSubmitting, 
//   onSubmit, 
//   onClose 
// }) => {
//   const handleTeamToggle = (teamId: string) => {
//     setSelectedTeams(
//       selectedTeams.includes(teamId)
//         ? selectedTeams.filter(id => id !== teamId)
//         : [...selectedTeams, teamId]
//     );
//   };

//   const handleSkillToggle = (skillId: number) => {
//     setSelectedSkills(
//       selectedSkills.includes(skillId)
//         ? selectedSkills.filter(id => id !== skillId)
//         : [...selectedSkills, skillId]
//     );
//   };

//   const handleUserToggle = (userId: string) => {
//     setExcludedUsers(
//       excludedUsers.includes(userId)
//         ? excludedUsers.filter(id => id !== userId)
//         : [...excludedUsers, userId]
//     );
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <h2 className="text-xl font-semibold">Initiate Bulk Assessment</h2>
//             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//               <XCircle className="h-6 w-6" />
//             </button>
//           </div>
//         </div>

//         <div className="p-6 space-y-6">
//           {/* Assessment Title */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Assessment Title *
//             </label>
//             <input
//               type="text"
//               value={bulkTitle}
//               onChange={(e) => setBulkTitle(e.target.value)}
//               placeholder="e.g., Q1 2024 Skills Assessment"
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Team Selection */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Target Teams (leave empty for all teams)
//               </label>
             
//               <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
//                 <div className="space-y-2">
//                    <SearchableCheckboxList
//                 items={teams}
//                 selected={selectedTeams}
//                 setSelected={setSelectedTeams}
//               />
//                   {/* {teams.map((team) => (
//                     <label key={team.id} className="flex items-center">
//                       <input
//                         type="checkbox"
//                         checked={selectedTeams.includes(team.id.toString())}
//                         onChange={() => handleTeamToggle(team.id.toString())}
//                         className="mr-2"
//                       />
//                       {team.name}
//                     </label>
//                   ))} */}
//                 </div>
//               </div>
//             </div>

//             {/* Skills Selection */}
//             {/* <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Skills to Assess *
//               </label>
//               <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
//                 <div className="space-y-2">
//                   <SearchableCheckboxList
//                     items={skills}
//                     selected={selectedSkills}
//                     setSelected={setSelectedSkills}
//                   />
//                   {/* {skills.map((skill) => (
//                     <label key={skill.id} className="flex items-center">
//                       <input
//                         type="checkbox"
//                         checked={selectedSkills.includes(skill.id)}
//                         onChange={() => handleSkillToggle(skill.id)}
//                         className="mr-2"
//                       />
//                       {skill.name}
//                     </label>
//                   ))} 
//                 </div>
//               </div>
//               <p className="text-sm text-gray-500 mt-1">
//                 Selected: {selectedSkills.length} skills
//               </p>
//             </div> */}
//           </div>

//           {/* Exclude Users */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Exclude Users (Optional)
//             </label>
//             <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 pt-0">
//               <div className="space-y-2">
//                 <SearchableCheckboxList
//                   items={users}
//                   selected={excludedUsers}
//                   setSelected={setExcludedUsers}
//                 />
//                 {/* {users.map((user) => (
//                   <label key={user.id} className="flex items-center text-sm">
//                     <input
//                       type="checkbox"
//                       checked={excludedUsers.includes(user.id)}
//                       onChange={() => handleUserToggle(user.id)}
//                       className="mr-2"
//                     />
//                     {user.name}
//                   </label>
//                 ))} */}
//               </div>
//             </div>
//           </div>

//           {/* Scheduled Date */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Scheduled Date (Optional)
//             </label>
//             <input
//               type="datetime-local"
//               value={scheduledDate}
//               onChange={(e) => setScheduledDate(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           {/* Schedule Type */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Schedule Type
//             </label>
//             <select
//               value={scheduleType}
//               onChange={(e) => setScheduleType(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             >
//               <option value="MONTHLY">Monthly</option>
//               <option value="QUARTERLY">Quarterly</option>
//               <option value="HALF_YEARLY">Half Yearly</option>
//               <option value="YEARLY">Yearly</option>
//             </select>
//             <p className="text-sm text-gray-500 mt-1">
//               Determines when the next assessment will be automatically scheduled
//             </p>
//           </div>

//           {/* Deadline Days */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Deadline (Days to Complete)
//             </label>
//             <input
//               type="number"
//               min="1"
//               max="30"
//               value={deadlineDays}
//               onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//             <p className="text-sm text-gray-500 mt-1">
//               Number of days from initiation to complete the assessment (1-30 days)
//             </p>
//           </div>

//           {/* Comments */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Comments
//             </label>
//             <textarea
//               value={comments}
//               onChange={(e) => setComments(e.target.value)}
//               rows={3}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Add any comments about this bulk assessment..."
//               required
//             />
//           </div>
//         </div>

//         <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//             disabled={isSubmitting}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onSubmit}
//             disabled={isSubmitting || !bulkTitle.trim()}
//             className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
//           >
//             {isSubmitting && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//             )}
//             {isSubmitting ? "Initiating..." : "Initiate Bulk Assessment"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const HRReviewModal: React.FC<{
//   assessment: AssessmentWithHistory;
//   comments: string;
//   setComments: (comments: string) => void;
//   isSubmitting: boolean;
//   onSubmit: (approved: boolean) => void;
//   onClose: () => void;
// }> = ({ assessment, comments, setComments, isSubmitting, onSubmit, onClose }) => {
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <h2 className="text-xl font-semibold">HR Final Review</h2>
//             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//               <XCircle className="h-6 w-6" />
//             </button>
//           </div>
//           <p className="text-sm text-gray-600 mt-1">
//             {assessment.user?.name} - Assessment #{assessment.id}
//           </p>
//         </div>

//         <div className="p-6 space-y-6">
//           {/* Assessment Overview */}
//           <div className="bg-gray-50 rounded-lg p-4">
//             <h3 className="font-medium mb-3">Assessment Summary</h3>
//             <div className="grid grid-cols-2 gap-4 text-sm">
//               <div>
//                 <span className="text-gray-500">Employee:</span>
//                 <span className="ml-2 font-medium">{assessment.user?.name}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500">Status:</span>
//                 <span className="ml-2 font-medium">Employee Approved</span>
//               </div>
//               <div>
//                 <span className="text-gray-500">Cycle:</span>
//                 <span className="ml-2">{assessment.currentCycle}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500">Skills:</span>
//                 <span className="ml-2">{assessment.detailedScores?.length || 0}</span>
//               </div>
//             </div>
//           </div>

//           {/* Skill Scores */}
//           <div>
//             <h3 className="font-medium mb-3">Lead Assessment Results</h3>
//             <div className="space-y-3">
//               {assessment.detailedScores?.map((score: DetailedScore) => (
//                 <div key={score.skillId} className="border border-gray-200 rounded-lg p-3">
//                   <div className="flex items-center justify-between">
//                     <span className="font-medium">{score.Skill?.name}</span>
//                     <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
//                       {score.score}/5
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* HR Comments */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               HR Comments 
//             </label>
//             <textarea
//               value={comments}
//               onChange={(e) => setComments(e.target.value)}
//               rows={4}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Add any comments about this final review..."
//               required
//             />
//           </div>

//           {/* Decision Instructions */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <h4 className="font-medium text-blue-900 mb-2">Final Review Decision</h4>
//             <ul className="text-sm text-blue-800 space-y-1">
//               <li>• <strong>Approve:</strong> Assessment is complete and scores are finalized</li>
//               <li>• <strong>Reject:</strong> Send back to lead for revision (increases cycle count)</li>
//             </ul>
//           </div>
//         </div>

//         <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//             disabled={isSubmitting}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => onSubmit(false)}
//             disabled={isSubmitting}
//             className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
//           >
//             <XCircle className="h-4 w-4" />
//             Reject & Send Back
//           </button>
//           <button
//             onClick={() => onSubmit(true)}
//             disabled={isSubmitting}
//             className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
//           >
//             {isSubmitting && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//             )}
//             <CheckCircle className="h-4 w-4" />
//             Approve & Complete
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const UserHistoryModal: React.FC<{
//   userName: string;
//   assessmentHistory: AssessmentWithHistory[];
//   isOpen: boolean;
//   onClose: () => void;
//   onShowScoreHistory: (assessmentId: number) => void;
//   getStatusColor: (status: AssessmentStatus) => string;
//   formatDate: (date: string | Date) => string;
// }> = ({ userName, assessmentHistory, isOpen, onClose, onShowScoreHistory, getStatusColor, formatDate }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <h2 className="text-xl font-semibold">Assessment History - {userName}</h2>
//             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//               <XCircle className="h-6 w-6" />
//             </button>
//           </div>
//           <p className="text-sm text-gray-600 mt-1">
//             Total assessments: {assessmentHistory.length}
//           </p>
//         </div>

//         <div className="p-6">
//           {assessmentHistory.length === 0 ? (
//             <div className="text-center py-8">
//               <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <p className="text-lg text-gray-600">No assessment history found</p>
//               <p className="text-sm text-gray-500">This user has no assessment records</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {assessmentHistory.map((assessment, index) => (
//                 <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
//                   <div className="flex items-center justify-between mb-3">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                         <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
//                       </div>
//                       <div>
//                         <h4 className="font-medium">Assessment #{assessment.id}</h4>
//                         <p className="text-sm text-gray-500">
//                           Created: {formatDate(assessment.requestedAt)}
//                         </p>
//                       </div>
//                     </div>
//                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
//                       {assessment.status.replace('_', ' ')}
//                     </span>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
//                     <div>
//                       <span className="text-gray-500">Status:</span>
//                       <span className="ml-2">{assessment.status.replace('_', ' ')}</span>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Cycle:</span>
//                       <span className="ml-2">{assessment.currentCycle}</span>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Skills:</span>
//                       <span className="ml-2">{assessment.detailedScores?.length || 0}</span>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Score Changes:</span>
//                       <span className="ml-2 font-medium text-blue-600">
//                         {assessment.history?.filter(h => h.auditType?.includes('SCORE')).length || 0}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
//                     <div>
//                       <span className="text-gray-500">Completed:</span>
//                       <span className="ml-2">{assessment.completedAt ? formatDate(assessment.completedAt) : 'Not completed'}</span>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Comments/Feedback:</span>
//                       <span className="ml-2 font-medium text-green-600">
//                         {assessment.history?.filter(h => h.comments && h.comments.trim().length > 0).length || 0}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Show skills and scores if available */}
//                   {assessment.detailedScores && assessment.detailedScores.length > 0 && (
//                     <div className="mt-4 pt-4 border-t border-gray-100">
//                       <div className="flex items-center justify-between mb-2">
//                         <h5 className="text-sm font-medium text-gray-700">Skills Assessment:</h5>
//                         <button
//                           onClick={() => onShowScoreHistory(assessment.id)}
//                           className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
//                         >
//                           View Score Changes
//                         </button>
//                       </div>
//                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
//                         {assessment.detailedScores.map((score: DetailedScore) => (
//                           <div key={score.skillId} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
//                             <span className="text-gray-700">{score.Skill?.name}</span>
//                             {score.score !== null ? (
//                               <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
//                                 {score.score}/5
//                               </span>
//                             ) : (
//                               <span className="text-gray-400 text-xs">Not scored</span>
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Show assessment history/audit trail with enhanced score tracking */}
//                   {assessment.history && assessment.history.length > 0 && (
//                     <div className="mt-4 pt-4 border-t border-gray-100">
//                       <h5 className="text-sm font-medium text-gray-700 mb-3">Assessment Timeline & Score Changes:</h5>
//                       <div className="space-y-2 max-h-40 overflow-y-auto">
//                         {assessment.history.map((audit, auditIndex) => {
//                           const isScoreChange = audit.auditType?.includes('SCORE');
//                           const isApproval = audit.auditType?.includes('APPROVED');
//                           const isRejection = audit.auditType?.includes('REJECTED');
                          
//                           return (
//                             <div 
//                               key={auditIndex} 
//                               className={`p-2 rounded text-xs border-l-4 ${
//                                 isScoreChange ? 'border-blue-400 bg-blue-50' :
//                                 isApproval ? 'border-green-400 bg-green-50' :
//                                 isRejection ? 'border-red-400 bg-red-50' :
//                                 'border-gray-400 bg-gray-50'
//                               }`}
//                             >
//                               <div className="flex items-start justify-between">
//                                 <div className="flex-1">
//                                   <div className="flex items-center gap-2 mb-1">
//                                     <span className={`font-medium ${
//                                       isScoreChange ? 'text-blue-700' :
//                                       isApproval ? 'text-green-700' :
//                                       isRejection ? 'text-red-700' :
//                                       'text-gray-700'
//                                     }`}>
//                                       {audit.auditType?.replace('_', ' ') || 'Unknown Action'}
//                                     </span>
//                                     <span className="text-gray-500">
//                                       by {(audit as any).editorName || 'System'}
//                                     </span>
//                                   </div>
//                                   {audit.comments && (
//                                     <div className="text-gray-600 mt-1">
//                                       {audit.comments}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <span className="text-gray-400 text-xs whitespace-nowrap ml-2">
//                                   {formatDate(audit.auditedAt)}
//                                 </span>
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="p-6 border-t border-gray-200 flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ScoreHistoryModal: React.FC<{
//   scoreHistory: any[];
//   isOpen: boolean;
//   onClose: () => void;
//   formatDate: (date: string | Date) => string;
// }> = ({ scoreHistory, isOpen, onClose, formatDate }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <h2 className="text-xl font-semibold">Score Change History</h2>
//             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//               <XCircle className="h-6 w-6" />
//             </button>
//           </div>
//           <p className="text-sm text-gray-600 mt-1">
//             Detailed history of all score changes for this assessment
//           </p>
//         </div>

//         <div className="p-6">
//           {scoreHistory.length === 0 ? (
//             <div className="text-center py-8">
//               <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <p className="text-lg text-gray-600">No score changes found</p>
//               <p className="text-sm text-gray-500">This assessment has no recorded score modifications</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {scoreHistory.map((change, index) => (
//                 <div key={change.id || index} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-white">
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-2">
//                         <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                           <TrendingUp className="h-4 w-4 text-blue-600" />
//                         </div>
//                         <div>
//                           <h4 className="font-medium text-blue-900">{change.skillName}</h4>
//                           <p className="text-sm text-gray-600">
//                             Changed by {change.changedBy} • Cycle {change.cycleNumber}
//                           </p>
//                         </div>
//                       </div>
                      
//                       <div className="flex items-center gap-4 text-sm">
//                         <div className="flex items-center gap-2">
//                           <span className="text-gray-500">Previous:</span>
//                           <span className={`px-2 py-1 rounded text-xs font-medium ${
//                             change.previousScore === null 
//                               ? 'bg-gray-100 text-gray-600'
//                               : 'bg-red-100 text-red-800'
//                           }`}>
//                             {change.previousScore === null ? 'Not scored' : `${change.previousScore}/5`}
//                           </span>
//                         </div>
                        
//                         <div className="text-gray-400">→</div>
                        
//                         <div className="flex items-center gap-2">
//                           <span className="text-gray-500">New:</span>
//                           <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
//                             {change.newScore}/5
//                           </span>
//                         </div>
//                       </div>

//                       {change.fullComment && (
//                         <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
//                           <span className="font-medium">Details: </span>
//                           {change.fullComment}
//                         </div>
//                       )}
//                     </div>
                    
//                     <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
//                       {formatDate(change.changedAt)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="p-6 border-t border-gray-200 flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

const BulkReviewModal: React.FC<{
  selectedCount: number;
  action: 'approve' | 'reject';
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}> = ({ selectedCount, action, comments, setComments, isSubmitting, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {action === 'approve' ? 'Accept' : 'Reject'} {selectedCount} Assessment{selectedCount > 1 ? 's' : ''}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Are you sure you want to {action === 'approve' ? 'accept' : 'reject'} {selectedCount} selected assessment{selectedCount > 1 ? 's' : ''}?
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments {action === 'reject' ? '(Required for rejection)' : '(Optional)'}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={`Add comments for this ${action === 'approve' ? 'approval' : 'rejection'}...`}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required={action === 'reject'}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || (action === 'reject' && !comments.trim())}
            className={`px-4 py-2 text-white rounded-md disabled:opacity-50 flex items-center gap-2 ${
              action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                {action === 'approve' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {action === 'approve' ? 'Accept All' : 'Reject All'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRAssessmentManagement;

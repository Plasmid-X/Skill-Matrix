import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import OAuthLoginForm from "../components/auth/OAuthLoginForm";
import OAuthCallback from "../components/auth/OAuthCallback";
import TopNavigation from "../components/layout/TopNavigation";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard";
import TeamLeadDashboard from "../components/dashboard/TeamLeadDashboard";
import HRDashboard from "../components/dashboard/HRDashboard";
import ProfilePage from "../components/profile/ProfilePage";
import TeamOverviewPage from "../components/team/TeamOverviewPage";
import SkillCriteriaPage from "../components/criteria/SkillCriteriaPage";
import SkillMatrixPage from "../components/matrix/SkillMatrixPage";
import SkillUpgradePage from "../components/upgrade/SkillUpgradePage";
import TeamAssessment from "@/components/assessment/teamAssessment/TeamAssessment";
import EmployeeAssessmentReview from "@/components/assessment/employeeAssessment/EmployeeAssessmentReview";
import HRAssessmentManagement from "@/components/assessment/hrAssessment/HRAssessmentManagement";
import HRAdminDashboard from "@/components/admin/HRAdminDashboard";
import AdminUsersPage from "@/components/admin/AdminUsersPage";
import AdminTeamsPage from "@/components/admin/AdminTeamsPage";
import AdminSubTeamsPage from "@/components/admin/AdminSubTeamsPage";
import AdminPositionsPage from "@/components/admin/AdminPositionsPage";
import AdminSkillsPage from "@/components/admin/AdminSkillsPage";
import { verifyLead } from "@/utils/helper";


const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const location = useLocation();
  const navigate = useNavigate();
  const [Dashboard,setDashboard] = useState(<></>);


  // useEffect(()=>{

  // },[])

  useEffect(() => {
    async function dashboard(){
      await renderDashboard();
    }
    dashboard();
    const path = location.pathname;
    if (path === "/") {
      setActiveTab("dashboard");
    } else if (path.startsWith("/profile")) {
      setActiveTab("profile");
    } else if (path.startsWith("/team-overview")) {
      setActiveTab("team-overview");
    } else if (path.startsWith("/skill-criteria")) {
      setActiveTab("skill-criteria");
    } else if (path.startsWith("/skill-matrix")) {
      setActiveTab("skill-matrix");
    } else if (path.startsWith("/skill-upgrade")) {
      setActiveTab("skill-upgrade");
    } else if (path.startsWith("/skill-assessment")) {
      setActiveTab("skill-assessment");
    } else if (path.startsWith("/pending-assessments")) {
      setActiveTab("pending-assessments");
    } else if(path.startsWith("/team-assessment")){
      setActiveTab("team-assessment");
    } else if(path.startsWith("/employee-assessment-review")){
      setActiveTab("employee-assessment-review");
    } else if(path.startsWith("/hr-assessment-management")){
      setActiveTab("hr-assessment-management");
    } else if(path.startsWith("/admin-dashboard")){
      setActiveTab("dashboard");
    } else if(path.startsWith("/admin-users")){
      setActiveTab("admin-users");
    } else if(path.startsWith("/admin-teams")){
      setActiveTab("admin-teams");
    } else if(path.startsWith("/admin-subteams")){
      setActiveTab("admin-subteams");
    } else if(path.startsWith("/admin-positions")){
      setActiveTab("admin-positions");
    } else if(path.startsWith("/admin-skills")){
      setActiveTab("admin-skills");
    }
    else {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check if we're on the OAuth callback route
    if (location.pathname === "/auth/callback") {
      return <OAuthCallback />;
    }
    // Check if we're on the legacy login route
    if (location.pathname === "/legacy-login") {
      return <LoginForm />;
    }
    return <OAuthLoginForm />;
  }
  
  const renderDashboard = async() => {
    
    if(user.role.name == 'admin'){
      setDashboard(<HRAdminDashboard />);
    }
    else if(user.role.name == 'hr'){
      setDashboard(<HRDashboard onNavigate={handleNavigate} />);
    }
    else if(await verifyLead(user.id)){
      setDashboard(<TeamLeadDashboard onNavigate={handleNavigate} />);
    }
    else{
      setDashboard(<EmployeeDashboard onNavigate={handleNavigate} />);
    }
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);

    switch (tab) {
      case "dashboard":
        navigate("/");
        break;
      case "profile":
        navigate("/profile");
        break;
      case "team-overview":
        navigate("/team-overview");
        break;
      case "skill-criteria":
        navigate("/skill-criteria");
        break;
      case "skill-matrix":
        navigate("/skill-matrix");
        break;
      case "skill-upgrade":
        navigate("/skill-upgrade");
        break;
      case "skill-assessment":
        navigate("/skill-assessment",{state:{user}});
        break;
      case "pending-assessments":
        navigate("/pending-assessments");
        break;
      case "team-assessment":
        navigate("/team-assessment");
        break;
      case "employee-assessment-review":
        navigate("/employee-assessment-review");
        break;
      case "hr-assessment-management":
        navigate("/hr-assessment-management");
        break;
      case "admin-users":
        navigate("/admin-users");
        break;
      case "admin-teams":
        navigate("/admin-teams");
        break;
      case "admin-subteams":
        navigate("/admin-subteams");
        break;
      case "admin-positions":
        navigate("/admin-positions");
        break;
      case "admin-skills":
        navigate("/admin-skills");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation activeTab={activeTab} onTabChange={handleNavigate} />
      <main className="p-8">
        <Routes>
          <Route path="/" element={Dashboard} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/team-overview" element={<TeamOverviewPage />} />
          <Route path="/skill-criteria" element={<SkillCriteriaPage />} />
          <Route path="/skill-matrix" element={<SkillMatrixPage />} />
          <Route path="/skill-upgrade" element={<SkillUpgradePage />} />
          <Route path="/team-assessment" element={<TeamAssessment/>}/>
          <Route path="/employee-assessment-review" element={<EmployeeAssessmentReview/>}/>
          <Route path="/hr-assessment-management" element={<HRAssessmentManagement/>}/>
          <Route path="/admin-dashboard" element={<HRAdminDashboard/>}/>
          <Route path="/admin-users" element={<AdminUsersPage/>}/>
          <Route path="/admin-teams" element={<AdminTeamsPage/>}/>
          <Route path="/admin-subteams" element={<AdminSubTeamsPage/>}/>
          <Route path="/admin-positions" element={<AdminPositionsPage/>}/>
          <Route path="/admin-skills" element={<AdminSkillsPage/>}/>
          <Route path="/login" element={<OAuthLoginForm />} />
          <Route path="/legacy-login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center text-gray-500">
                Page not found
              </div>
            }
          />
        </Routes>
      </main>
      
    </div>
  );
};

export default Index;

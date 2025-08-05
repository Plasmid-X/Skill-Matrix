import {XCircle} from "lucide-react";

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

interface Skill {
  id: number;
  name: string;
}

export const InitiateAssessmentModal: React.FC<{
  users: User[];
  skills: Skill[];
  selectedUser: string;
  setSelectedUser: (user: string) => void;
  selectedSkills: number[];
  setSelectedSkills: (skills: number[]) => void;
  scheduledDate: string;
  setScheduledDate: (date: string) => void;
  scheduleType: string;
  setScheduleType: (type: string) => void;
  deadlineDate: string;
  setDeadlineDate: (date: string) => void;
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}> = ({ 
  users, 
  skills, 
  selectedUser, 
  setSelectedUser, 
  selectedSkills, 
  setSelectedSkills, 
  scheduledDate, 
  setScheduledDate, 
  scheduleType,
  setScheduleType,
  deadlineDate,
  setDeadlineDate,
  comments, 
  setComments, 
  isSubmitting, 
  onSubmit, 
  onClose 
}) => {
  const handleSkillToggle = (skillId: number) => {
    setSelectedSkills(
      selectedSkills.includes(skillId)
        ? selectedSkills.filter(id => id !== skillId)
        : [...selectedSkills, skillId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Initiate Individual Assessment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee/Team Lead
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a user...</option>
              {users.filter(user => user.name && user.id).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role?.name || 'Unknown Role'} 
                </option>
              ))}
            </select>
          </div>

          {/* Skills Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Skills to Assess
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              <div className="space-y-2">
                {skills.filter(skill => skill.name && skill.id).map((skill) => (
                  <label key={skill.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill.id)}
                      onChange={() => handleSkillToggle(skill.id)}
                      className="mr-2"
                    />
                    {skill.name}
                  </label>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Selected: {selectedSkills.length} skills
            </p>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Type
            </label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="HALF_YEARLY">Half Yearly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Determines when the next assessment will be automatically scheduled
            </p>
          </div>

          {/* Deadline Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Date
            </label>
            <input
              type="datetime-local"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Select the date and time when the assessment should be completed
            </p>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any comments about this assessment..."
              required
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !selectedUser || selectedSkills.length === 0 || !deadlineDate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSubmitting ? "Initiating..." : "Initiate Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
};
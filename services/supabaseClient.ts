import { createClient } from '@supabase/supabase-js';
// Fix: Import UserRole as a value since it is used as one.
import { UserRole } from '../types';
import type { User, Institution, StudentProgress, AvatarStyle } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

let supabaseUrl = SUPABASE_URL;
let supabaseAnonKey = SUPABASE_ANON_KEY;

// --- URL CORRECTION LOGIC ---
// Automatically correct a common user error: pasting the dashboard URL instead of the API URL.
const dashboardUrlPattern = /supabase\.com\/dashboard\/project\/([a-zA-Z0-9]+)/;
const match = supabaseUrl.match(dashboardUrlPattern);
if (match && match[1]) {
    const projectRef = match[1];
    const correctedUrl = `https://${projectRef}.supabase.co`;
    console.warn(`Incorrect Supabase URL detected. Automatically corrected from dashboard URL to API URL: ${correctedUrl}`);
    supabaseUrl = correctedUrl;
}
// --- END URL CORRECTION LOGIC ---

// Check for placeholder values and substitute them to prevent a crash.
// The app will load but Supabase functionality will fail until valid keys are provided.
if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    console.error('Supabase URL is not configured. Please add it to config.ts');
    supabaseUrl = 'https://placeholder.supabase.co'; // A validly formatted but fake URL
}
if (!supabaseAnonKey || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    console.error('Supabase Anon Key is not configured. Please add it to config.ts');
    // A correctly formatted but fake JWT-like key.
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImV4cCI6MTk4MjQ1ODAwMH0.placeholder_key_so_app_doesnt_crash';
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to map Supabase profile (snake_case) to app User type (camelCase)
const mapProfileToUser = (profile: any): User => ({
    id: profile.id,
    name: profile.name,
    role: profile.role,
    institutionId: profile.institution_id,
    class: profile.class,
    avatarUrl: profile.avatar_url,
    rollNumber: profile.roll_number,
    avatarStyle: profile.avatar_style,
});

// Helper to map app User type to a profile object for updating
const mapUserToProfile = (user: User) => ({
    name: user.name,
    role: user.role,
    class: user.class,
    avatar_url: user.avatarUrl,
    roll_number: user.rollNumber,
    avatar_style: user.avatarStyle,
});

// Helper to map Supabase institution to app Institution type
const mapDataToInstitution = (data: any): Institution => ({
    id: data.id,
    name: data.name,
    address: data.address,
    phoneNumber: data.phone_number,
});

// Helper to map app Institution type to a db object for updating
const mapInstitutionToData = (institution: Institution) => ({
    name: institution.name,
    address: institution.address,
    phone_number: institution.phoneNumber,
});

export const fetchUserProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data ? mapProfileToUser(data) : null;
};

export const fetchInstitution = async (institutionId: string): Promise<Institution | null> => {
    const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', institutionId)
        .single();

    if (error) {
        console.error('Error fetching institution:', error);
        return null;
    }
    return data ? mapDataToInstitution(data) : null;
};

export const fetchStudentProgress = async (userId: string): Promise<StudentProgress | undefined> => {
    const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        // It's not an error if a student has no progress yet
        if (error.code !== 'PGRST116') {
             console.error('Error fetching student progress:', error);
        }
        return { quizScores: {}, labScores: {}, timeSpent: 0 };
    }
    return data as StudentProgress;
};

export const updateProfile = async (user: User, institution: Institution): Promise<boolean> => {
    // Update profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update(mapUserToProfile(user))
        .eq('id', user.id);
    
    if (profileError) {
        console.error("Error updating profile:", profileError);
        return false;
    }
    
    // Update institution
    const { error: institutionError } = await supabase
        .from('institutions')
        .update(mapInstitutionToData(institution))
        .eq('id', institution.id);

    if (institutionError) {
        console.error("Error updating institution:", institutionError);
        return false;
    }
    
    return true;
};

// --- Teacher Specific Functions ---

export const fetchStudentsForInstitution = async (institutionId: string): Promise<User[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('role', 'Student');
    
    if (error) {
        console.error("Error fetching students:", error);
        return [];
    }
    return data.map(mapProfileToUser);
};

export const fetchProgressForStudents = async (userIds: string[]): Promise<Record<string, StudentProgress>> => {
    if (userIds.length === 0) return {};
    
    const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .in('user_id', userIds);
        
    if (error) {
        console.error("Error fetching student progress data:", error);
        return {};
    }
    
    const progressMap: Record<string, StudentProgress> = {};
    userIds.forEach(id => {
        const progress = data.find(p => p.user_id === id);
        progressMap[id] = progress || { quizScores: {}, labScores: {}, timeSpent: 0 };
    });
    
    return progressMap;
};

export const addStudent = async (studentData: any, institutionId: string): Promise<User | null> => {
    const { name, email, password, class: className, rollNumber } = studentData;

    // Step 1: Fetch the institution name from its ID, which is required by the trigger.
    const institution = await fetchInstitution(institutionId);
    if (!institution) {
        alert("Error: Could not find the teacher's institution. Aborting student creation.");
        console.error("addStudent failed: institution not found for ID", institutionId);
        return null;
    }
    const institutionName = institution.name;

    // Step 2: Sign up the new user, passing all metadata for the trigger to use.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                role: 'Student', // Role is always student when added by a teacher
                classInfo: className,
                institutionName: institutionName,
                rollNumber: rollNumber,
            },
        },
    });

    if (signUpError) {
        alert(`Error adding student: ${signUpError.message}`);
        console.error(signUpError);
        return null;
    }

    if (!signUpData.user) {
        alert("An unknown error occurred while creating the student's account.");
        return null;
    }
    
    // Step 3: The trigger runs automatically. After a short delay, fetch the newly created profile.
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    const newProfile = await fetchUserProfile(signUpData.user.id);
    
    if (newProfile) {
        alert("Student added successfully! They can now log in with the credentials provided.");
        return newProfile;
    } else {
        alert("Student account was created, but their profile could not be found. Please check the roster again in a minute.");
        // Return a temporary user object so the UI can update optimistically.
        return {
            id: signUpData.user.id,
            name: name,
            role: UserRole.STUDENT,
            institutionId: institutionId,
            class: className,
            avatarUrl: `https://picsum.photos/seed/${signUpData.user.id}/100/100`,
            rollNumber: rollNumber,
            avatarStyle: 'default',
        };
    }
};


export const updateStudent = async (student: User): Promise<boolean> => {
    const { error } = await supabase
        .from('profiles')
        .update(mapUserToProfile(student))
        .eq('id', student.id);
        
    if (error) {
        alert(`Error updating student: ${error.message}`);
        console.error(error);
        return false;
    }
    return true;
};

export const deleteStudent = async (studentId: string): Promise<boolean> => {
    // We cannot delete from auth.users on the client.
    // We will delete the profile and progress data.
    
    // 1. Delete progress
    const { error: progressError } = await supabase.from('student_progress').delete().eq('user_id', studentId);
    if (progressError) {
        alert(`Error deleting student progress: ${progressError.message}`);
        console.error(progressError);
        return false;
    }

    // 2. Delete profile
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', studentId);
    if (profileError) {
        alert(`Error deleting student profile: ${profileError.message}`);
        console.error(profileError);
        return false;
    }
    
    alert("Student data has been deleted. The user can no longer access the platform with their profile.");
    return true;
};

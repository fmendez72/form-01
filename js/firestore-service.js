// js/firestore-service.js
// Firestore database operations

import { db } from './firebase-config.js';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================================
// USER OPERATIONS
// ============================================================

export async function createUser(email, userData) {
  const userRef = doc(db, 'users', email);
  await setDoc(userRef, {
    email: email,
    role: userData.role || 'coder',
    assignedJobs: userData.assignedJobs || [],
    createdAt: serverTimestamp(),
    status: 'active'
  });
}

export async function getUser(email) {
  const userRef = doc(db, 'users', email);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

export async function getAllUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() }));
}

export async function updateUser(email, updates) {
  const userRef = doc(db, 'users', email);
  await updateDoc(userRef, updates);
}

export async function assignJobToUser(email, jobId) {
  const user = await getUser(email);
  if (user) {
    const jobs = user.assignedJobs || [];
    if (!jobs.includes(jobId)) {
      jobs.push(jobId);
      await updateUser(email, { assignedJobs: jobs });
    }
  }
}

export async function createUsersFromCSV(usersData) {
  const batch = writeBatch(db);
  const results = { created: 0, errors: [] };
  
  for (const user of usersData) {
    try {
      const userRef = doc(db, 'users', user.email);
      batch.set(userRef, {
        email: user.email,
        role: user.role || 'coder',
        assignedJobs: user.assignedJobs || [],
        createdAt: serverTimestamp(),
        status: 'active'
      });
      results.created++;
    } catch (error) {
      results.errors.push({ email: user.email, error: error.message });
    }
  }
  
  await batch.commit();
  return results;
}

// ============================================================
// TEMPLATE OPERATIONS
// ============================================================

export async function createTemplate(templateSchema, createdBy) {
  const templateRef = doc(db, 'templates', templateSchema.jobId);
  await setDoc(templateRef, {
    ...templateSchema,
    createdBy: createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function getTemplate(jobId) {
  const templateRef = doc(db, 'templates', jobId);
  const templateSnap = await getDoc(templateRef);
  return templateSnap.exists() ? templateSnap.data() : null;
}

export async function getAllTemplates() {
  const templatesRef = collection(db, 'templates');
  const q = query(templatesRef, where('status', '==', 'active'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ jobId: doc.id, ...doc.data() }));
}

export async function updateTemplate(jobId, updates) {
  const templateRef = doc(db, 'templates', jobId);
  await updateDoc(templateRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function archiveTemplate(jobId) {
  await updateTemplate(jobId, { status: 'archived' });
}

// ============================================================
// RESPONSE OPERATIONS
// ============================================================

// Generate response ID: email_jobId_timestamp
function generateResponseId(email, jobId) {
  const timestamp = Date.now();
  const sanitizedEmail = email.replace(/[@.]/g, '_');
  return `${sanitizedEmail}_${jobId}_${timestamp}`;
}

export async function createResponse(email, jobId, templateVersion) {
  const responseId = generateResponseId(email, jobId);
  const responseRef = doc(db, 'responses', responseId);
  
  await setDoc(responseRef, {
    responseId: responseId,
    userEmail: email,
    jobId: jobId,
    templateVersion: templateVersion,
    status: 'draft',
    data: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    submittedAt: null
  });
  
  return responseId;
}

export async function getResponse(responseId) {
  const responseRef = doc(db, 'responses', responseId);
  const responseSnap = await getDoc(responseRef);
  return responseSnap.exists() ? responseSnap.data() : null;
}

export async function getUserResponses(email) {
  const responsesRef = collection(db, 'responses');
  const q = query(responsesRef, where('userEmail', '==', email));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function getJobResponses(jobId) {
  const responsesRef = collection(db, 'responses');
  const q = query(responsesRef, where('jobId', '==', jobId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function getAllResponses() {
  const responsesRef = collection(db, 'responses');
  const snapshot = await getDocs(responsesRef);
  return snapshot.docs.map(doc => doc.data());
}

export async function updateResponseData(responseId, data) {
  const responseRef = doc(db, 'responses', responseId);
  await updateDoc(responseRef, {
    data: data,
    updatedAt: serverTimestamp()
  });
}

export async function submitResponse(responseId) {
  const responseRef = doc(db, 'responses', responseId);
  await updateDoc(responseRef, {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// Get or create a response for user+job combination
export async function getOrCreateResponse(email, jobId, templateVersion) {
  // Check for existing draft
  const responsesRef = collection(db, 'responses');
  const q = query(
    responsesRef, 
    where('userEmail', '==', email),
    where('jobId', '==', jobId),
    where('status', '==', 'draft')
  );
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    // Return existing draft
    return snapshot.docs[0].data();
  }
  
  // Create new response
  const responseId = await createResponse(email, jobId, templateVersion);
  return await getResponse(responseId);
}

// ============================================================
// EXPORT UTILITIES
// ============================================================

export function responsesToCSV(responses, template) {
  if (responses.length === 0) return '';
  
  // Build header row
  const headers = ['responseId', 'userEmail', 'jobId', 'status', 'submittedAt'];
  const fieldIds = template.fields.map(f => f.id);
  const noteIds = template.fields.map(f => `${f.id}_note`);
  const allHeaders = [...headers, ...fieldIds, ...noteIds];
  
  // Build data rows
  const rows = responses.map(response => {
    const row = [
      response.responseId,
      response.userEmail,
      response.jobId,
      response.status,
      response.submittedAt?.toDate?.()?.toISOString() || ''
    ];
    
    // Add field values
    fieldIds.forEach(fieldId => {
      const value = response.data?.[fieldId] ?? '';
      row.push(escapeCSV(value));
    });
    
    // Add notes
    noteIds.forEach(noteId => {
      const value = response.data?.[noteId] ?? '';
      row.push(escapeCSV(value));
    });
    
    return row.join(',');
  });
  
  return [allHeaders.join(','), ...rows].join('\n');
}

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

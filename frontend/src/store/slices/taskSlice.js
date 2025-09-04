import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Action asynchrone pour récupérer la liste des utilisateurs (pour le formulaire d'assignation)
export const fetchUsers = createAsyncThunk(
  'tasks/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        cache: 'no-store', // Pour éviter le cache et forcer une nouvelle réponse
      });
      
      console.log('Response status:', response.status); // Log pour déboguer
      
      if (!response.ok) {
        return rejectWithValue(response.status === 304 ? 'Ressource non modifiée' : 'Erreur lors de la récupération des utilisateurs');
      }
      
      const data = await response.json();
      console.log('API response for fetchUsers:', data); // Log pour déboguer
      
      return data.data; // Retourne uniquement le tableau 'data'
    } catch (error) {
      console.error('Fetch error:', error);
      return rejectWithValue('Erreur de connexion au serveur');
    }
  }
);

// Actions asynchrones pour les tâches
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Erreur lors de la récupération des tâches');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue('Erreur de connexion au serveur');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('http://localhost:5000/api/tasks/add', { // ✅ Correction : /tasks/add
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          ...taskData,
          assignedUserId: taskData.assignedUserId // ✅ Ajout pour spécifique (renommé pour backend)
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Erreur lors de la création de la tâche');
      }
      
      return data.task; // ✅ Correction : retourner data.task
    } catch (error) {
      return rejectWithValue('Erreur de connexion au serveur');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(taskData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Erreur lors de la modification de la tâche');
      }
      
      return data; // Votre backend retourne { message, task }
    } catch (error) {
      return rejectWithValue('Erreur de connexion au serveur');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Erreur lors de la suppression de la tâche');
      }
      
      return taskId;
    } catch (error) {
      return rejectWithValue('Erreur de connexion au serveur');
    }
  }
);

// État initial
const initialState = {
  tasks: [],
  users: [], // ✅ Ajout pour stocker la liste des utilisateurs (pour assignation)
  isLoading: false,
  error: null,
  filter: 'all', // all, todo, in_progress, completed
};

// Slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTasks: (state) => {
      state.tasks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.push(action.payload); // ✅ action.payload contient déjà la tâche
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        // ✅ Correction : utiliser action.payload.task
        const index = state.tasks.findIndex(task => task._id === action.payload.task._id);
        if (index !== -1) {
          state.tasks[index] = action.payload.task;
        }
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter(task => task._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilter, clearError, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
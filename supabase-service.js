/**
 * supabase-service.js
 * Ein Modul zur Verwaltung der Supabase-Verbindung und -Operationen
 */

// Konfigurationsvariablen für Supabase
const CORS_PROXY = "https://corsproxy.io/?";

// Status-Variablen
let connectionStatus = "Nicht initialisiert";
let isInitialized = false;
let useProxy = false;

/**
 * Initialisiert den Supabase-Client
 * @returns {Promise<boolean>} - True, wenn die Initialisierung erfolgreich war
 */
async function initialize() {
  console.log('Initialisiere Supabase-Service...');
  
  // Prüfen, ob Supabase bereits initialisiert wurde
  if (isInitialized && window.supabaseClient) {
    console.log('Supabase-Client bereits initialisiert');
    return true;
  }
  
  try {
    // Prüfen, ob der Supabase-Client in der globalen Variable verfügbar ist
    if (!window.supabaseClient) {
      console.error('Supabase-Client nicht in globaler Variable verfügbar');
      connectionStatus = "Fehler: Supabase-Client nicht verfügbar";
      return false;
    }
    
    console.log('Supabase-Client gefunden, teste Verbindung...');
    
    // Verbindung testen
    const testResult = await testConnection();
    isInitialized = testResult;
    
    return testResult;
  } catch (error) {
    console.error('Fehler bei der Initialisierung des Supabase-Clients:', error);
    connectionStatus = `Initialisierungsfehler: ${error.message}`;
    return false;
  }
}

/**
 * Testet die Verbindung zum Supabase-Server
 * @returns {Promise<boolean>} - True, wenn die Verbindung erfolgreich ist
 */
async function testConnection() {
  if (!window.supabaseClient) {
    console.error('Kann Verbindung nicht testen: Supabase-Client nicht initialisiert');
    connectionStatus = "Fehler: Client nicht initialisiert";
    return false;
  }
  
  console.log('Teste Supabase-Verbindung...');
  connectionStatus = "Teste Verbindung...";
  
  try {
    // Einfache Anfrage zum Testen der Verbindung
    const { data, error, count } = await window.supabaseClient
      .from('leaderboard')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('Verbindungstest erfolgreich:', { data, count });
    connectionStatus = "Verbindung erfolgreich!";
    useProxy = false;
    return true;
  } catch (error) {
    console.error('Verbindungstest fehlgeschlagen:', error);
    
    // Wenn es ein CORS-Problem gibt, versuche es mit dem Proxy
    if (error.message && error.message.includes('CORS')) {
      connectionStatus = "CORS-Fehler: Versuche mit Proxy...";
      return await testConnectionWithProxy();
    } else {
      connectionStatus = `Verbindungsfehler: ${error.message}`;
      return false;
    }
  }
}

/**
 * Testet die Verbindung mit dem CORS-Proxy
 * @returns {Promise<boolean>} - True, wenn die Verbindung erfolgreich ist
 */
async function testConnectionWithProxy() {
  console.log('Teste Verbindung mit CORS-Proxy...');
  
  try {
    const response = await fetch(CORS_PROXY + window.supabaseClient.supabaseUrl + '/rest/v1/leaderboard?select=count', {
      method: 'GET',
      headers: {
        'apikey': window.supabaseClient.supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Netzwerkantwort nicht OK: ${response.status}`);
    }
    
    console.log('Proxy-Verbindungstest erfolgreich');
    connectionStatus = "Verbindung über Proxy erfolgreich!";
    useProxy = true;
    return true;
  } catch (error) {
    console.error('Proxy-Verbindungstest fehlgeschlagen:', error);
    connectionStatus = `Proxy-Fehler: ${error.message}`;
    return false;
  }
}

/**
 * Holt die globalen Highscores aus der Datenbank
 * @param {number} limit - Maximale Anzahl der abzurufenden Einträge
 * @returns {Promise<Object>} - Objekt mit Daten und Fehler
 */
async function fetchHighScores(limit = 10) {
  if (!isInitialized) {
    const initResult = await initialize();
    if (!initResult) {
      return { data: [], error: new Error('Supabase nicht initialisiert') };
    }
  }
  
  console.log('Rufe globale Highscores ab...');
  connectionStatus = "Lade Online-Bestenliste...";
  
  try {
    if (useProxy) {
      return await fetchHighScoresWithProxy(limit);
    } else {
      const { data, error } = await window.supabaseClient
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      console.log('Globale Highscores abgerufen:', data);
      connectionStatus = data.length > 0 ? "" : "Keine Online-Scores gefunden";
      
      return { data, error: null };
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Highscores:', error);
    
    // Detaillierte Fehleranalyse
    if (error.code === 'PGRST301') {
      connectionStatus = "Tabelle nicht gefunden";
    } else if (error.message && error.message.includes('CORS')) {
      connectionStatus = "CORS-Fehler: Versuche mit Proxy...";
      return await fetchHighScoresWithProxy(limit);
    } else {
      connectionStatus = `Fehler beim Laden: ${error.message || "Unbekannter Fehler"}`;
    }
    
    return { data: [], error };
  }
}

/**
 * Holt die Highscores mit dem CORS-Proxy
 * @param {number} limit - Maximale Anzahl der abzurufenden Einträge
 * @returns {Promise<Object>} - Objekt mit Daten und Fehler
 */
async function fetchHighScoresWithProxy(limit = 10) {
  console.log('Rufe Highscores mit CORS-Proxy ab...');
  
  try {
    const response = await fetch(
      CORS_PROXY + window.supabaseClient.supabaseUrl + `/rest/v1/leaderboard?select=*&order=score.desc&limit=${limit}`, 
      {
        method: 'GET',
        headers: {
          'apikey': window.supabaseClient.supabaseKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Netzwerkantwort nicht OK: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Daten mit CORS-Proxy abgerufen:', data);
    
    connectionStatus = data.length > 0 ? "Daten über CORS-Proxy geladen" : "Keine Daten über CORS-Proxy gefunden";
    
    return { data, error: null };
  } catch (error) {
    console.error('Fehler beim Abrufen mit CORS-Proxy:', error);
    connectionStatus = `CORS-Proxy-Fehler: ${error.message}`;
    return { data: [], error };
  }
}

/**
 * Speichert einen Highscore in der Datenbank
 * @param {string} playerName - Name des Spielers
 * @param {number} score - Punktzahl
 * @param {number} level - Erreichtes Level
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
async function saveHighScore(playerName, score, level) {
  if (!isInitialized) {
    const initResult = await initialize();
    if (!initResult) {
      return { success: false, error: new Error('Supabase nicht initialisiert') };
    }
  }
  
  console.log('Speichere Punktzahl in Supabase:', { playerName, score, level });
  connectionStatus = "Speichere Punktzahl...";
  
  const scoreData = {
    player_name: playerName,
    score: score,
    level: level
  };
  
  try {
    if (useProxy) {
      return await saveHighScoreWithProxy(scoreData);
    } else {
      const { data, error } = await window.supabaseClient
        .from('leaderboard')
        .insert([scoreData]);
      
      if (error) throw error;
      
      console.log('Punktzahl in Datenbank gespeichert', data);
      connectionStatus = "Punktzahl gespeichert!";
      
      return { success: true, data, error: null };
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Punktzahl:', error);
    
    // Versuche es mit dem CORS-Proxy, wenn es ein CORS-Problem gibt
    if (error.message && error.message.includes('CORS')) {
      connectionStatus = "Versuche mit CORS-Proxy...";
      return await saveHighScoreWithProxy(scoreData);
    } else {
      connectionStatus = `Fehler beim Speichern: ${error.message}`;
      return { success: false, error };
    }
  }
}

/**
 * Speichert einen Highscore mit dem CORS-Proxy
 * @param {Object} scoreData - Daten des Highscores
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
async function saveHighScoreWithProxy(scoreData) {
  console.log('Speichere Punktzahl mit CORS-Proxy...');
  
  try {
    const response = await fetch(CORS_PROXY + window.supabaseClient.supabaseUrl + '/rest/v1/leaderboard', {
      method: 'POST',
      headers: {
        'apikey': window.supabaseClient.supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify([scoreData])
    });
    
    if (!response.ok) {
      throw new Error(`Netzwerkantwort nicht OK: ${response.status}`);
    }
    
    console.log('Punktzahl mit CORS-Proxy gespeichert');
    connectionStatus = "Punktzahl über Proxy gespeichert!";
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Fehler beim Speichern mit CORS-Proxy:', error);
    connectionStatus = `Proxy-Fehler: ${error.message}`;
    
    // Versuche es ohne level-Feld als Fallback
    if (error.message && (error.message.includes('level') || error.status === 400)) {
      return await saveHighScoreWithoutLevel(scoreData.player_name, scoreData.score, scoreData.level);
    }
    
    return { success: false, error };
  }
}

/**
 * Speichert einen Highscore ohne das Level-Feld
 * @param {string} playerName - Name des Spielers
 * @param {number} score - Punktzahl
 * @param {number} level - Erreichtes Level
 * @returns {Promise<Object>} - Ergebnis der Operation
 */
async function saveHighScoreWithoutLevel(playerName, score, level) {
  console.log('Versuche Speichern ohne Level-Feld...');
  connectionStatus = "Versuche ohne Level-Feld...";
  
  const simpleScoreData = {
    player_name: playerName,
    score: score
  };
  
  try {
    if (useProxy) {
      const response = await fetch(CORS_PROXY + window.supabaseClient.supabaseUrl + '/rest/v1/leaderboard', {
        method: 'POST',
        headers: {
          'apikey': window.supabaseClient.supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify([simpleScoreData])
      });
      
      if (!response.ok) {
        throw new Error(`Netzwerkantwort nicht OK: ${response.status}`);
      }
      
      console.log('Punktzahl ohne Level-Feld mit Proxy gespeichert');
      connectionStatus = "Punktzahl gespeichert (ohne Level)!";
      
      return { success: true, error: null };
    } else {
      const { data, error } = await window.supabaseClient
        .from('leaderboard')
        .insert([simpleScoreData]);
      
      if (error) throw error;
      
      console.log('Punktzahl ohne Level-Feld gespeichert', data);
      connectionStatus = "Punktzahl gespeichert (ohne Level)!";
      
      return { success: true, data, error: null };
    }
  } catch (error) {
    console.error('Fehler beim Speichern ohne Level-Feld:', error);
    connectionStatus = `Fehler beim Speichern: ${error.message}`;
    return { success: false, error };
  }
}

/**
 * Gibt den aktuellen Verbindungsstatus zurück
 * @returns {string} - Aktueller Verbindungsstatus
 */
function getConnectionStatus() {
  return connectionStatus;
}

/**
 * Gibt zurück, ob Supabase initialisiert ist
 * @returns {boolean} - True, wenn Supabase initialisiert ist
 */
function isSupabaseInitialized() {
  return isInitialized;
}

// Exportiere die Funktionen in das globale window-Objekt
window.SupabaseService = {
  initialize,
  testConnection,
  fetchHighScores,
  saveHighScore,
  getConnectionStatus,
  isSupabaseInitialized
};

// Initialisiere den Service automatisch
console.log('Supabase-Service wird automatisch initialisiert...');
initialize().then(result => {
  console.log('Automatische Initialisierung abgeschlossen:', result);
}).catch(error => {
  console.error('Fehler bei der automatischen Initialisierung:', error);
}); 
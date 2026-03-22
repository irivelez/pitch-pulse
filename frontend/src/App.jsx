import { useState } from 'react';
import { usePitchSocket } from './usePitchSocket';
import PersonaSelector from './PersonaSelector';
import VoiceSession from './VoiceSession';
import BoardReport from './BoardReport';

function App() {
    const [screen, setScreen] = useState('SELECT'); // SELECT | SESSION | REPORT
    const [persona, setPersona] = useState(null); // { key, name, tagline }
    const [reportData, setReportData] = useState(null);
    const socket = usePitchSocket();

    const handleSelectPersona = (personaObj) => {
        setPersona(personaObj);
        setReportData(null);
        setScreen('SESSION');
    };

    const handleReport = (data) => {
        setReportData(data);
        setScreen('REPORT');
    };

    const handleReset = () => {
        socket.disconnect();
        setPersona(null);
        setReportData(null);
        setScreen('SELECT');
    };

    return (
        <div className="min-h-screen min-h-[100dvh] bg-pulse-dark text-[#F0F0F5]">
            {screen === 'SELECT' && (
                <PersonaSelector onSelect={handleSelectPersona} />
            )}
            {screen === 'SESSION' && (
                <VoiceSession
                    persona={persona}
                    socket={socket}
                    onReport={handleReport}
                    onBack={handleReset}
                />
            )}
            {screen === 'REPORT' && (
                <BoardReport
                    data={reportData}
                    personaName={persona?.name}
                    onReset={handleReset}
                />
            )}
        </div>
    );
}

export default App;

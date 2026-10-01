const fs = require('fs');

// Patch page.tsx (Login Page)
const loginPath = 'd:/educator-erp-chatbot/src/app/page.tsx';
let loginCode = fs.readFileSync(loginPath, 'utf8');

// Remove teamName state and logic
loginCode = loginCode.replace(/const \[teamName, setTeamName\] = useState\(""\);/g, '');
loginCode = loginCode.replace(/teamName: agentDoc\.teamName/g, '');
loginCode = loginCode.replace(/teamName: teamName\.trim\(\),?/g, '');
loginCode = loginCode.replace(/teamName: teamName\.trim\(\)/g, '');
// Remove the Team Name input field completely
loginCode = loginCode.replace(/{!isLoginMode && \([\s\S]*?<\/div>\s*\)}/g, '');

fs.writeFileSync(loginPath, loginCode);

// Patch chat/page.tsx (Chat Page)
const chatPath = 'd:/educator-erp-chatbot/src/app/chat/page.tsx';
let chatCode = fs.readFileSync(chatPath, 'utf8');

// Remove teamName from user state and sessionId logic
chatCode = chatCode.replace(/teamName: string/g, '');
chatCode = chatCode.replace(/setSessionId\(`\${parsedUser\.teamName\.replace\(\/ \/g, '_'\)}_\${parsedUser\.userId}`\);/g, 'setSessionId(`session_${parsedUser.userId}`);');
chatCode = chatCode.replace(/clientId: user\.teamName,/g, '');
chatCode = chatCode.replace(/clientName: user\.teamName,/g, '');
chatCode = chatCode.replace(/{user\.teamName} Chat/g, 'Support Chat');
chatCode = chatCode.replace(/help the {user\.teamName}\./g, 'help you today.');

fs.writeFileSync(chatPath, chatCode);

console.log("Team name logic successfully stripped from Chatbot.");

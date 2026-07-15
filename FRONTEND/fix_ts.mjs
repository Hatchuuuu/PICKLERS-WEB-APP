import fs from 'fs';

// Fix auth page
let authContent = fs.readFileSync('./src/app/auth/page.tsx', 'utf8');
authContent = authContent.replace(/const \[searchParams\] = useSearchParams\(\);/, 'const searchParams = useSearchParams();');
authContent = authContent.replace(/router\.push\(`([^`]+)`, \{ replace: true \}\)/g, 'router.replace(`$1`)');
fs.writeFileSync('./src/app/auth/page.tsx', authContent, 'utf8');

// Fix facility/[id]/page.tsx
let facilityContent = fs.readFileSync('./src/app/(player)/app/facility/[id]/page.tsx', 'utf8');
facilityContent = facilityContent.replace(/Number\(([^)]+)\)/g, 'String($1)');
facilityContent = facilityContent.replace(/id === 1/g, 'id === "1"'); // fallback
// Wait, the error is Argument of type 'number' is not assignable to type 'string'.
// It's probably `const facility = MOCK_FACILITIES.find(f => f.id === Number(id));`
// But MOCK_FACILITIES `id` is a string! So we shouldn't use `Number(id)`.
facilityContent = facilityContent.replace(/Number\(id\)/g, 'id as string');
fs.writeFileSync('./src/app/(player)/app/facility/[id]/page.tsx', facilityContent, 'utf8');

// Fix Owner application page
let ownerContent = fs.readFileSync('./src/app/(player)/app/owner-application/page.tsx', 'utf8');
ownerContent = ownerContent.replace(/Number\(id\)/g, 'id as string');
fs.writeFileSync('./src/app/(player)/app/owner-application/page.tsx', ownerContent, 'utf8');

// Fix FacilityDetailView
let viewContent = fs.readFileSync('./src/components/shared/FacilityDetailView.tsx', 'utf8');
viewContent = viewContent.replace(/Number\(id\)/g, 'id as string');
fs.writeFileSync('./src/components/shared/FacilityDetailView.tsx', viewContent, 'utf8');

console.log('Fixed minor TS errors');

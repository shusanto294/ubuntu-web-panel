#!/bin/bash

echo "🔧 Fixing Lucide React icon imports..."

# Fix all icon imports in all JSX files
find client/src -name "*.jsx" -type f -exec sed -i '
# Fix import statements
s/GlobeAltIcon/Globe/g
s/CloudIcon/Cloud/g
s/ServerIcon/Server/g
s/CheckCircleIcon/CheckCircle/g
s/MailIcon/Mail/g
s/PlusIcon/Plus/g
s/TrashIcon/Trash/g
s/ShieldCheckIcon/ShieldCheck/g
s/ExclamationTriangleIcon/AlertTriangle/g
s/CogIcon/Settings/g
s/UserIcon/User/g
s/EyeIcon/Eye/g
s/EyeSlashIcon/EyeOff/g
s/DocumentIcon/FileText/g
s/ArrowPathIcon/RotateCcw/g
s/XMarkIcon/X/g
s/ChevronRightIcon/ChevronRight/g
s/ChevronDownIcon/ChevronDown/g
s/HomeIcon/Home/g
s/BarsIcon/Menu/g
s/Bars3Icon/Menu/g
s/XCircleIcon/XCircle/g
s/CheckIcon/Check/g
s/InformationCircleIcon/Info/g
s/ExclamationCircleIcon/AlertCircle/g
s/PencilIcon/Edit/g
s/ArrowRightIcon/ArrowRight/g
s/ArrowLeftIcon/ArrowLeft/g
s/RefreshIcon/RefreshCw/g
s/DownloadIcon/Download/g
s/UploadIcon/Upload/g
s/SearchIcon/Search/g
s/FilterIcon/Filter/g
s/SortAscIcon/ArrowUp/g
s/SortDescIcon/ArrowDown/g
s/CalendarIcon/Calendar/g
s/ClockIcon/Clock/g
s/LocationIcon/MapPin/g
s/PhoneIcon/Phone/g
s/EnvelopeIcon/Mail/g
s/LinkIcon/Link/g
s/ShareIcon/Share/g
s/CopyIcon/Copy/g
s/PrintIcon/Printer/g
s/SaveIcon/Save/g
s/FolderIcon/Folder/g
s/FileIcon/File/g
s/ImageIcon/Image/g
s/VideoIcon/Video/g
s/MusicIcon/Music/g
s/VolumeIcon/Volume2/g
s/MicrophoneIcon/Mic/g
s/CameraIcon/Camera/g
s/WifiIcon/Wifi/g
s/BluetoothIcon/Bluetooth/g
s/BatteryIcon/Battery/g
s/PowerIcon/Power/g
s/LockIcon/Lock/g
s/UnlockIcon/Unlock/g
s/KeyIcon/Key/g
s/ShieldIcon/Shield/g
s/StarIcon/Star/g
s/HeartIcon/Heart/g
s/ThumbsUpIcon/ThumbsUp/g
s/ThumbsDownIcon/ThumbsDown/g
s/ChatIcon/MessageCircle/g
s/CommentIcon/MessageSquare/g
s/NotificationIcon/Bell/g
s/AlertIcon/AlertTriangle/g
s/WarningIcon/AlertTriangle/g
s/ErrorIcon/AlertCircle/g
s/SuccessIcon/CheckCircle/g
s/InfoIcon/Info/g
s/QuestionIcon/HelpCircle/g
s/MinusIcon/Minus/g
s/EqualsIcon/Equal/g
s/SlashIcon/Slash/g
s/BackslashIcon/Backslash/g
s/DotIcon/Circle/g
s/SquareIcon/Square/g
s/TriangleIcon/Triangle/g
s/DiamondIcon/Diamond/g
s/HexagonIcon/Hexagon/g
s/CircleIcon/Circle/g
s/RectangleIcon/Square/g
s/OvalIcon/Circle/g
' {} \;

echo "✅ Fixed icon imports in all JSX files"

# Fix specific common import patterns
find client/src -name "*.jsx" -type f -exec sed -i '
s/{ PlusIcon, TrashIcon, ShieldCheckIcon, GlobeAltIcon }/{ Plus, Trash, ShieldCheck, Globe }/g
s/{ GlobeAltIcon, CloudIcon, ServerIcon, CheckCircleIcon, MailIcon }/{ Globe, Cloud, Server, CheckCircle, Mail }/g
s/{ UserIcon, CogIcon, HomeIcon }/{ User, Settings, Home }/g
s/{ BarsIcon, XMarkIcon }/{ Menu, X }/g
s/{ EyeIcon, EyeSlashIcon }/{ Eye, EyeOff }/g
s/{ DocumentIcon, ArrowPathIcon }/{ FileText, RotateCcw }/g
s/{ ChevronRightIcon, ChevronDownIcon }/{ ChevronRight, ChevronDown }/g
s/{ ExclamationTriangleIcon, CheckCircleIcon }/{ AlertTriangle, CheckCircle }/g
' {} \;

echo "✅ Fixed common import patterns"

# Show what files were modified
echo ""
echo "📋 Modified files:"
find client/src -name "*.jsx" -type f | while read file; do
    if grep -q "from 'lucide-react'" "$file"; then
        echo "  • $file"
    fi
done

echo ""
echo "🎉 All Lucide React icons have been fixed!"
echo "Now you can run: cd client && npm run build"
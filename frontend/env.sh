#!/bin/sh

cat << EOF > ./env.js
window.__ENV__ = {
  REACT_APP_API_BASE_URL: "$REACT_APP_API_BASE_URL"
}
EOF



# NOTE if you have any problems with starting frontend container due to:
#      env.sh not found or permission denied, that is probably due to different
#      end of lines on windows and linux (if u created/ copied this project on Windows)
#      to repair that, edit file in notpead as:
#      Edycja > Zakończenia linii (EOL Conversion), Wybierz Unix (LF)
#      or edit it in git bash with command dos2unix env.sh

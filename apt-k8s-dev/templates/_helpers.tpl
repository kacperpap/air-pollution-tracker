{{- define "apt.name" -}}
{{ .Chart.Name }}
{{- end -}}

# .Relese.Name is build-in helm variable, representing helm's release name
# enables do differentiate each deployment of same chart, by unique identifier
{{- define "apt.fullname" -}}
{{ include "apt.name" . }}-{{ .Release.Name }}
{{- end -}}

{{- define "apt.version" -}}
{{ default .Chart.AppVersion .Chart.Version }}
{{- end -}}


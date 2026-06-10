Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objShell = CreateObject("WScript.Shell")

' Get the folder path
strFolder = objFSO.GetParentFolderName(WScript.ScriptFullName)
strFile = strFolder & "\dashboard-launch-outlook.html"

' Read the HTML file
Set objFile = objFSO.OpenTextFile(strFile, 1)
strHTML = objFile.ReadAll
objFile.Close

' Create Outlook email
Set objOutlook = CreateObject("Outlook.Application")
Set objMail = objOutlook.CreateItem(0)

objMail.Subject = "Launch: RSOB Quality Performance Dashboard - NA & EU"
objMail.HTMLBody = strHTML
objMail.Display

Set objMail = Nothing
Set objOutlook = Nothing

MsgBox "Email opened in Outlook! Review and send.", vbInformation, "Done"

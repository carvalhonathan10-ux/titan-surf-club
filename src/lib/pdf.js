import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const MARINE = [7, 67, 103]
const ORANGE = [238, 122, 60]
const SABLE = [244, 236, 222]

function header(doc, title, subtitle) {
  doc.setFillColor(...MARINE)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('TITAN SURF CLUB', 14, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text("Île de La Réunion — Toute Incapacité Trouve Adaptation Nécessaire", 14, 20)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 27)
  doc.setTextColor(0, 0, 0)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, 14, 38)
  }
}

function footer(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(
      `Titan Surf Club · contact.titan.run@gmail.com · Généré le ${format(new Date(), 'd MMMM yyyy', { locale: fr })}`,
      14, 290
    )
  }
}

export function exportFicheAdherentPDF(adherent, stat, historique, achats) {
  const doc = new jsPDF()
  header(doc, `Fiche adhérent — ${adherent.prenom} ${adherent.nom}`)

  autoTable(doc, {
    startY: 44,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    body: [
      ['Sexe', adherent.sexe || '—', 'Date de naissance', adherent.date_naissance || '—'],
      ['Email', adherent.email || '—', 'Téléphone', adherent.telephone || '—'],
      ['Contact', adherent.contact_nom || '—', 'Adresse', adherent.adresse || '—'],
      ['Licence', adherent.licence ? 'Oui' : 'Non', "Droit à l'image", adherent.droit_image ? 'Oui' : 'Non'],
      ['Pathologie / situation', adherent.pathologie || '—', '', ''],
      ['Séances restantes', String(stat?.seances_restantes ?? '—'), 'Séances réalisées', String(stat?.seances_realisees ?? '—')],
    ],
    columnStyles: { 0: { fontStyle: 'bold', textColor: MARINE }, 2: { fontStyle: 'bold', textColor: MARINE } },
  })

  let y = doc.lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...MARINE)
  doc.text('Historique des paiements', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [['Type', 'Montant', 'Mode', 'Date', 'Statut']],
    body: (achats || []).map(a => [
      a.type === 'licence' ? 'Licence' : a.type === 'carnet_10' ? 'Carnet 10 séances' : 'Séance unique',
      `${a.montant} €`, a.mode_paiement || '—', a.date_paiement || '—', a.statut,
    ]),
    headStyles: { fillColor: MARINE },
    styles: { fontSize: 9 },
  })

  y = doc.lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...MARINE)
  doc.text('Historique des séances', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [['Date', 'Heure', 'Présence']],
    body: (historique || []).map(h => [
      format(parseISO(h.sessions_surf.date), 'd MMM yyyy', { locale: fr }),
      h.sessions_surf.heure?.slice(0, 5) || '—',
      h.present ? 'Présent' : 'Absent',
    ]),
    headStyles: { fillColor: MARINE },
    styles: { fontSize: 9 },
  })

  footer(doc)
  doc.save(`fiche_${adherent.nom}_${adherent.prenom}.pdf`)
}

export function exportListePresencePDF(session, reservations) {
  const doc = new jsPDF()
  header(
    doc,
    'Liste de présence',
    `${format(parseISO(session.date), 'EEEE d MMMM yyyy', { locale: fr })} · ${session.heure?.slice(0, 5)} · ${session.lieu}`
  )

  autoTable(doc, {
    startY: 44,
    head: [['Adhérent', 'Présent']],
    body: reservations.map(r => [`${r.adherents?.nom} ${r.adherents?.prenom}`, r.present ? '✔' : '']),
    headStyles: { fillColor: MARINE },
    styles: { fontSize: 10 },
  })

  footer(doc)
  doc.save(`presence_${session.date}.pdf`)
}

export function exportBilanFinancierPDF(achats) {
  const doc = new jsPDF()
  header(doc, 'Bilan financier')

  const paye = achats.filter(a => a.statut === 'Payé')
  const ca = paye.reduce((s, a) => s + Number(a.montant || 0), 0)

  autoTable(doc, {
    startY: 44,
    theme: 'plain',
    styles: { fontSize: 10 },
    body: [
      ['Total encaissé', `${ca.toFixed(2)} €`],
      ['Règlements payés', String(paye.length)],
      ['Règlements en attente', String(achats.length - paye.length)],
    ],
    columnStyles: { 0: { fontStyle: 'bold', textColor: MARINE } },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Adhérent', 'Type', 'Montant', 'Mode', 'Date', 'Statut']],
    body: achats.map(a => [
      `${a.adherents?.nom || ''} ${a.adherents?.prenom || ''}`,
      a.type === 'licence' ? 'Licence' : a.type === 'carnet_10' ? 'Carnet 10 séances' : 'Séance unique',
      `${a.montant} €`, a.mode_paiement || '—', a.date_paiement || '—', a.statut,
    ]),
    headStyles: { fillColor: MARINE },
    styles: { fontSize: 8 },
  })

  footer(doc)
  doc.save(`bilan_financier_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

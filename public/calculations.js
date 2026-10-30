// All money is held as integer minor units. Alternative quotes never count as commitments.
export function isActivePayment(state, payment) {
  if(payment.voided)return false;
  if(payment.type!=='refund'||!payment.originalId)return true;
  const original=state.payments.find(p=>p.id===payment.originalId);
  return !original||!original.voided;
}
export function paidForCost(state, costId) {
  const payments=state.payments.filter(p=>isActivePayment(state,p)&&p.costId===costId).reduce((sum,p)=>sum+(p.type==='refund'?-p.amount:p.amount),0);
  const corrections=(state.paymentCorrections||[]).filter(c=>!c.voided&&c.costId===costId).reduce((sum,c)=>sum+c.amount,0);
  return payments+corrections;
}
export function totals(state) {
  const costs = state.costs.filter(x => !x.voided);
  let agreed = 0, paid = 0, outstanding = 0, overpaid = 0, forecast = 0;
  for (const c of costs) {
    const net = paidForCost(state,c.id);
    paid += net;
    if (c.status === 'agreed') {
      agreed += c.amount;
      outstanding += Math.max(c.amount - net, 0);
      overpaid += Math.max(net - c.amount, 0);
      forecast += c.amount;
    } else forecast += c.amount;
  }
  const target = state.project.target || 0, reserve = state.project.reserve || 0;
  return { target, reserve, agreed, paid, outstanding, overpaid, forecast, unallocated: target - agreed - reserve, forecastHeadroom: target - forecast - reserve };
}
// The item budget excludes the separate savings snapshot and emergency reserve.
export function plannedBudgetProgress(t) {
  const planned=t.forecast, paid=t.paid, remaining=planned-paid;
  const percent=planned>0?Math.round(paid/planned*1000)/10:null;
  const ringPercent=planned>0?Math.min(100,Math.max(0,paid/planned*100)):0;
  return {planned,paid,remaining,percent,ringPercent};
}
export function progress(tasks) {
  const active = tasks.filter(t => !t.archived && t.status !== 'Skip');
  const done = active.filter(t => t.status === 'Done').length;
  return { done, total: active.length, remaining: active.length - done, percent: active.length ? Math.round(done / active.length * 100) : null };
}
export function parseMoney(value) {
  const s = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  const n = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isSafeInteger(n) ? n : null;
}
export function dateLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

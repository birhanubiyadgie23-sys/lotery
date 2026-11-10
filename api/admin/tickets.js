// Admin Tickets Load & Approve / Reject
    async function loadAdminTickets() {
      try {
        const res = await fetch(`${API}/admin/tickets`);
        const data = await res.json();
        const list = document.getElementById('adminTicketList');
        list.innerHTML = '';
        
        const tickets = data.tickets || [];
        if(tickets.length === 0) {
          list.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-slate-400">ምንም ቲኬት የለም</td></tr>';
          return;
        }
        tickets.forEach(t => {
          list.innerHTML += `
            <tr class="border-b border-white/5">
              <td class="py-2 px-2">${t.fullName}</td>
              <td class="py-2 px-2">${t.phone}</td>
              <td class="py-2 px-2">${t.transactionId}</td>
              <td class="py-2 px-2 font-bold text-yellow-400">${t.ticketNumber}</td>
              <td class="py-2 px-2"><span class="px-2 py-0.5 rounded font-bold ${t.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">${t.status}</span></td>
              <td class="py-2 px-2 flex gap-1">
                ${t.status === 'Pending' ? `
                  <button onclick="updateTicketStatus('${t.id}', 'Approved')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px]">አጽድቅ</button>
                  <button onclick="updateTicketStatus('${t.id}', 'Rejected')" class="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[10px]">ውድቅ አድርግ</button>
                ` : '<span class="text-slate-400">ተጠናቋል</span>'}
              </td>
            </tr>`;
        });
      } catch (err) {
        console.error("Failed to load admin tickets:", err);
      }
    }

    // ቲኬትን ማጽደቅ ወይም ውድቅ ማድረግ የሚልክ ራሱን የቻለ ፋንክሽን
    async function updateTicketStatus(id, status) {
      try {
        const res = await fetch(`${API}/admin/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status })
        });
        const result = await res.json();
        if (result.success) {
          loadAdminTickets();
        } else {
          alert(result.message || 'ሰርቨሩ ስህተት አሳይቷል');
        }
      } catch (err) {
        alert('ሰርቨር ጋር መገናኘት አልቻለም');
      }
    }

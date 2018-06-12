const workerCampaigns = (() => {
  const applyCampaign = function(event) {
    const campaignId = event.target.getAttribute('data-campaign-id');
    fetch(`/worker/campaigns/apply/${campaignId}`, {
      credentials: 'same-origin',
      method: 'POST'
    })
      .then(response => {
        if (response.status == 200) {
          window.location.reload(true);
        }
      })
      .catch(error => console.log(error));
    event.preventDefault();
  };

  const init = () => {
    const htmlAppliableCampaigns = document.querySelectorAll('#appliable-campaigns button');
    htmlAppliableCampaigns.forEach(e => e.onclick = applyCampaign);
  };

  const toggleDisplay = cssSelector => {
    const el = document.querySelector(cssSelector);
    const display = el.style.display;
    el.style.display = display == 'none' ? 'block' : 'none';
  };

  return {
    init,
    toggleDisplay
  };
})();

document.addEventListener('DOMContentLoaded', workerCampaigns.init, false);
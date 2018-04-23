const onLoad = (() => {
  const applyCampaign = function(event) {
    console.log(event);
    const campaignId = event.target.getAttribute('data-campaign-id');
    fetch(`/worker/campaigns/apply/${campaignId}`, {
      credentials: 'same-origin',
      method: 'POST'
    })
      .then(response => {
        console.log(response);
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

  return init;
})();

document.addEventListener('DOMContentLoaded', onLoad, false);
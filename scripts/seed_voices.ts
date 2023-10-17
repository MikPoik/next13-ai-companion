async function seedVoices() {
  const { PrismaClient } = require('@prisma/client');

  const db = new PrismaClient();
  try {
    await db.voice.createMany({
      data: [
        {
          id: 'none',
          name: 'none',
          voice_id: 'none',
          sample_url: 'none'
        },
        {
          id: '98d4af7d-aca0-4a70-a26e-4ca59023a248',
          name: 'Aaron Dreschner - British - Male',
          voice_id: '98d4af7d-aca0-4a70-a26e-4ca59023a248',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Aaron%20Dreschner_3f627f80-b679-41a1-bd04-eacc924f12b0.wav'
        },
        {
          id: 'b1ec84ad-c7c6-4085-b3e9-fcae55529b77',
          name: 'Abrahan Mack - British - Male',
          voice_id: 'b1ec84ad-c7c6-4085-b3e9-fcae55529b77',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Abrahan%20Mack_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'b479aa77-3af6-45b6-9a96-506bd867c5a2',
          name: 'Adde Michal - American - Male',
          voice_id: 'b479aa77-3af6-45b6-9a96-506bd867c5a2',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Adde%20Michal_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '21c15eb5-5dae-4954-ad1f-d922b6ffdd97',
          name: 'Alexandra Hisakawa - American - Female',
          voice_id: '21c15eb5-5dae-4954-ad1f-d922b6ffdd97',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Alexandra%20Hisakawa_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'de21e9e3-2da0-478e-a3d8-4b042d3a3b28',
          name: 'Alison Dietlinde - British - Female',
          voice_id: 'de21e9e3-2da0-478e-a3d8-4b042d3a3b28',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Alison%20Dietlinde_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '9ffb15f0-c15c-45be-8bcf-7210975a468a',
          name: 'Alma Maria - British - Female',
          voice_id: '9ffb15f0-c15c-45be-8bcf-7210975a468a',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Alma%20Mar%C3%ADa_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'f05c5b91-7540-4b26-b534-e820d43065d1',
          name: 'Ana Florence - British - Female',
          voice_id: 'f05c5b91-7540-4b26-b534-e820d43065d1',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Ana%20Florence_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '81bad083-72dc-4071-8548-70ba944b8039',
          name: 'Andrew Chipper - American - Female',
          voice_id: '81bad083-72dc-4071-8548-70ba944b8039',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Andrew%20Chipper_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'ff34248d-1fae-479b-85b6-9ae2b6043acd',
          name: 'Annmarie Nele - British - Female',
          voice_id: 'ff34248d-1fae-479b-85b6-9ae2b6043acd',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Annmarie%20Nele_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'e34ac3b4-0aed-4a7f-adf5-f2a2e2424694',
          name: 'Asya Anara - British - Female',
          voice_id: 'e34ac3b4-0aed-4a7f-adf5-f2a2e2424694',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Asya%20Anara_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'b67f6eb1-c3ac-4da2-b359-47895eb93580',
          name: 'Badr Odhiambo - American - Female',
          voice_id: 'b67f6eb1-c3ac-4da2-b359-47895eb93580',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Badr%20Odhiambo_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'e399c204-7040-4f1d-bb92-5223fa6feceb',
          name: 'Baldur Sanjin - American - Male',
          voice_id: 'e399c204-7040-4f1d-bb92-5223fa6feceb',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Baldur%20Sanjin_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '96a5a860-e2a6-41b9-8c86-aaa5605bb106',
          name: 'Barbora MacLean - American - Female',
          voice_id: '96a5a860-e2a6-41b9-8c86-aaa5605bb106',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Barbora%20MacLean_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '9b1cb1b4-f4fa-48ea-af20-54c91f35bfdd',
          name: 'Brenda Stern - American - Female',
          voice_id: '9b1cb1b4-f4fa-48ea-af20-54c91f35bfdd',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Brenda%20Stern_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '91b2cf5c-6939-4449-b085-52a63cad4d35',
          name: 'Camilla Holmstrom - American - Female',
          voice_id: '91b2cf5c-6939-4449-b085-52a63cad4d35',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Camilla%20Holmstr%C3%B6m_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'dfaac753-646c-473a-9461-004c6c40595a',
          name: 'Chandra MacFarland - British - Female',
          voice_id: 'dfaac753-646c-473a-9461-004c6c40595a',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Chandra%20MacFarland_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'b8ffb895-79b8-4ec6-be9c-6eb2d1fbe83c',
          name: 'Claribel Dervla - American - Female',
          voice_id: 'b8ffb895-79b8-4ec6-be9c-6eb2d1fbe83c',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Claribel%20Dervla_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '27373d4a-0b84-480d-9ce3-fc34fba415be',
          name: 'Craig Gutsy - American - Male',
          voice_id: '27373d4a-0b84-480d-9ce3-fc34fba415be',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Craig%20Gutsy_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '90ae3b42-29b1-479c-b012-846b0b640c72',
          name: 'Daisy Studious - British - Female',
          voice_id: '90ae3b42-29b1-479c-b012-846b0b640c72',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Daisy%20Studious_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '0f82817b-eea7-4f28-8a02-5900a1b23e30',
          name: 'Damien Black - American - Male',
          voice_id: '0f82817b-eea7-4f28-8a02-5900a1b23e30',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Damien%20Black_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '68376275-5971-4328-a04a-b415f5db66ec',
          name: 'Damjan Chapman - American - Male',
          voice_id: '68376275-5971-4328-a04a-b415f5db66ec',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Damjan%20Chapman_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '6720d486-5d43-4d92-8893-57a1b58b334d',
          name: 'Dionisio Schuyler - American - Male',
          voice_id: '6720d486-5d43-4d92-8893-57a1b58b334d',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Dionisio%20Schuyler_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'a612c179-0544-426f-9eaf-0bc9bf26502d',
          name: 'Eugenio Mataraci - British - Male',
          voice_id: 'a612c179-0544-426f-9eaf-0bc9bf26502d',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Eugenio%20Matarac%C4%B1_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '4fa404c3-4168-414c-a6e9-2e7654cc2908',
          name: 'Ferran Simen - American - Male',
          voice_id: '4fa404c3-4168-414c-a6e9-2e7654cc2908',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Ferran%20Simen_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '865c749c-e313-4ca1-b746-7a82307d1c74',
          name: 'Filip Traverse - American - Male',
          voice_id: '865c749c-e313-4ca1-b746-7a82307d1c74',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Filip%20Traverse_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'ba43f07b-67bf-47a2-bce5-b1d5fa2ba1b5',
          name: 'Gilberto Mathias - American - Male',
          voice_id: 'ba43f07b-67bf-47a2-bce5-b1d5fa2ba1b5',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Gilberto%20Mathias_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'd91d2f95-1a1d-4062-bad1-f1497bb5b487',
          name: 'Gitta Nikolina - British - Female',
          voice_id: 'd91d2f95-1a1d-4062-bad1-f1497bb5b487',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Gitta%20Nikolina_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '6ec4d93b-1f54-4420-91f8-33f188ee61f3',
          name: 'Gracie Wise - American - Female',
          voice_id: '6ec4d93b-1f54-4420-91f8-33f188ee61f3',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Gracie%20Wise_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '8255e841-3b5c-48af-9089-640a2ee2c308',
          name: 'Henriette Usha - British - Female',
          voice_id: '8255e841-3b5c-48af-9089-640a2ee2c308',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Henriette%20Usha_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: 'c8267b8d-5261-4275-81f2-84231640f206',
          name: 'Ige Behringer - American - Male',
          voice_id: 'c8267b8d-5261-4275-81f2-84231640f206',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Ige%20Behringer_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          id: '8ca72d29-f9ec-4df8-8ad0-de7a1c5790b0',
          name: 'Ilkin Urbano - British - Male',
          voice_id: '8ca72d29-f9ec-4df8-8ad0-de7a1c5790b0',
          sample_url: 'https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Ilkin%20Urbano_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav'
        },
        {
          "id": "ab86648c-68d3-4b03-a6dc-f4a78cf527d5",
          "name": "Kazuhiko Atallah-American-Male",
          "voice_id": "ab86648c-68d3-4b03-a6dc-f4a78cf527d5",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Kazuhiko%20Atallah_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "92202dab-e5dd-425e-a2c7-fcc924b98948",
          "name": "Kumar Dahl-British-Male",
          "voice_id": "92202dab-e5dd-425e-a2c7-fcc924b98948",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Kumar%20Dahl_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "9d5631a6-1a43-426d-a639-4bf54ae58d27",
          "name": "Lidiya Szekeres-British-Female",
          "voice_id": "9d5631a6-1a43-426d-a639-4bf54ae58d27",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Lidiya%20Szekeres_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "a8327a5b-f672-487c-9ebc-565d7d8ac2ce",
          "name": "Lilya Stainthorpe-British-Female",
          "voice_id": "a8327a5b-f672-487c-9ebc-565d7d8ac2ce",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Lilya%20Stainthorpe_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "e1a51d31-0f2f-4532-98d4-7b73e2481d06",
          "name": "Ludvig Milivoj-American-Male",
          "voice_id": "e1a51d31-0f2f-4532-98d4-7b73e2481d06",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Ludvig%20Milivoj_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "99a8fa8b-db80-4278-af6e-2bb47e09fa93",
          "name": "Luis Moray-American-Male",
          "voice_id": "99a8fa8b-db80-4278-af6e-2bb47e09fa93",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Luis%20Moray_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "dd78e7b7-5114-486d-9e4e-3c4e1843df7d",
          "name": "Maja Ruoho-British-Female",
          "voice_id": "dd78e7b7-5114-486d-9e4e-3c4e1843df7d",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Maja%20Ruoho_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "5067963f-10e6-4003-b9d2-f52993669bcc",
          "name": "Marcos Rudaski-American-Male",
          "voice_id": "5067963f-10e6-4003-b9d2-f52993669bcc",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Maja%20Ruoho_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "71c6c3eb-98ca-4a05-8d6b-f8c2b5f9f3a3",
          "name": "Narelle Moon-American-Female",
          "voice_id": "71c6c3eb-98ca-4a05-8d6b-f8c2b5f9f3a3",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Narelle%20Moon_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "7be35898-4c5a-4afd-b6fb-1963a3cc9d0f",
          "name": "Nova Hogarth-American-Female",
          "voice_id": "7be35898-4c5a-4afd-b6fb-1963a3cc9d0f",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Nova%20Hogarth_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "24fb1414-3398-458e-9286-29e06d883b33",
          "name": "Rosemary Okafor-American-Female",
          "voice_id": "24fb1414-3398-458e-9286-29e06d883b33",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Rosemary%20Okafor_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "67c19643-429d-4cef-bb30-bf2a84ba1c84",
          "name": "Royston Min-British-Male",
          "voice_id": "67c19643-429d-4cef-bb30-bf2a84ba1c84",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Royston%20Min_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "ebe2db86-62a6-49a1-907a-9a1360d4416e",
          "name": "Sofia Hellen-British-Female",
          "voice_id": "ebe2db86-62a6-49a1-907a-9a1360d4416e",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Sofia%20Hellen_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "b082061d-695e-4d1b-a8f9-b5c4cb8e6e2a",
          "name": "Suad Qasim-British-Female",
          "voice_id": "b082061d-695e-4d1b-a8f9-b5c4cb8e6e2a",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Suad%20Qasim_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "8f3b11ce-ed66-4752-a705-c05fe381a587",
          "name": "Szofi Granger-American-Female",
          "voice_id": "8f3b11ce-ed66-4752-a705-c05fe381a587",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Szofi%20Granger_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "fd613b67-e9b8-45ae-8702-a34ff65f1b78",
          "name": "Tammie Ema-American-Female",
          "voice_id": "fd613b67-e9b8-45ae-8702-a34ff65f1b78",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Tammie%20Ema_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "9145d03c-2da9-4893-8c92-ee9480e75830",
          "name": "Tammy Grit-British-Female",
          "voice_id": "9145d03c-2da9-4893-8c92-ee9480e75830",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Tammy%20Grit_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "f6d81c82-1376-4dd5-9825-cd9f353cbfb9",
          "name": "Tanja Adelina-British-Female",
          "voice_id": "f6d81c82-1376-4dd5-9825-cd9f353cbfb9",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Tanja%20Adelina_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "d4b43fc7-6e16-4664-b9ec-97246f505d8d",
          "name": "Torcull Diarmuid-American-Male",
          "voice_id": "d4b43fc7-6e16-4664-b9ec-97246f505d8d",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Torcull%20Diarmuid_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "ff850b82-81e2-410d-be1f-ed127dc151f0",
          "name": "Uta Obando-British-Female",
          "voice_id": "ff850b82-81e2-410d-be1f-ed127dc151f0",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Uta%20Obando_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "c791b5b5-0558-42b8-bb0b-602ac5efc0b9",
          "name": "Viktor Eka-British-Male",
          "voice_id": "c791b5b5-0558-42b8-bb0b-602ac5efc0b9",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Viktor%20Eka_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "d2bd7ccb-1b65-4005-9578-32c4e02d8ddf",
          "name": "Viktor Menelaos-British-Male",
          "voice_id": "d2bd7ccb-1b65-4005-9578-32c4e02d8ddf",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Viktor%20Menelaos_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "cb4f835e-7f61-4b8c-a0f6-f059bbf6f583",
          "name": "Vjollca Johnnie-British-Female",
          "voice_id": "cb4f835e-7f61-4b8c-a0f6-f059bbf6f583",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Vjollca%20Johnnie_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "0614364f-457b-4622-b02e-3dd4ad7941c4",
          "name": "Wulf Carlevaro-American-Male",
          "voice_id": "0614364f-457b-4622-b02e-3dd4ad7941c4",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Wulf%20Carlevaro_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "c1c04ef0-7c10-4174-b6ce-9dcdf37bc63b",
          "name": "Xavier Hayasaka-British-Male",
          "voice_id": "c1c04ef0-7c10-4174-b6ce-9dcdf37bc63b",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Xavier%20Hayasaka_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "fc9917ef-8f32-418e-9254-e535c0c6df3d",
          "name": "Zacharie Aimilios-American-Male",
          "voice_id": "fc9917ef-8f32-418e-9254-e535c0c6df3d",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Zacharie%20Aimilios_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        },
        {
          "id": "64b58ac0-54d1-4aae-8344-c52f3dfe2c9a",
          "name": "Zofija Kendrick-American-Female",
          "voice_id": "64b58ac0-54d1-4aae-8344-c52f3dfe2c9a",
          "sample_url": "https://storage.googleapis.com/coqui-samples/XTTS_Personalities_Meet_the_Gang_Zofija%20Kendrick_3f627f80-b679-41a1-bd04-eacc924f12b0_.wav"
        }
      ],
    });
  } catch (error) {
    console.error('Error seeding default voices:', error);
  } finally {
    await db.$disconnect();
  }
}

seedVoices();

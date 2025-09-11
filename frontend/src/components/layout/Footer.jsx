import { Facebook, Instagram, Linkedin } from "lucide-react"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black text-white border border-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Brand section - 2 column grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-left">
              <h2 className="text-lg sm:text-2xl font-bold">
                JUSTCLOTHING.
                <br />
                STORE
              </h2>
            </div>
            <div className="text-right">
              <h3 className="text-lg sm:text-xl font-bold mb-2">LET'S TALK!</h3>
              <p className="text-xs sm:text-sm">contact@justclothing.store</p>
              <p className="text-xs sm:text-sm">+88 01714206969</p>
            </div>
          </div>

          {/* Links section - 2 column grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-3">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:underline">About us</a></li>
                <li><a href="/services" className="hover:underline">Our services</a></li>
                <li><a href="/policies" className="hover:underline">Policies & guidelines</a></li>
                <li><a href="/legal" className="hover:underline">Legal</a></li>
                <li><a href="/blog" className="hover:underline">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3">Get Help</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/faq" className="hover:underline">FAQ</a></li>
                <li><a href="/order-status" className="hover:underline">Order status</a></li>
                <li><a href="/tutorials" className="hover:underline">Tutorials</a></li>
                <li><a href="/payment-options" className="hover:underline">Payment Options</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="text-center pt-6 border-t border-gray-800 space-y-4">
            <p className="text-xs text-gray-400">JUSTCLOTHING.STORE {currentYear} All Rights Reserved©</p>
            <div className="flex justify-center space-x-4">
              <a href="https://facebook.com" className="bg-white rounded-full p-2" aria-label="Facebook">
                <Facebook className="h-4 w-4 text-black" />
              </a>
              <a href="https://instagram.com" className="bg-white rounded-full p-2" aria-label="Instagram">
                <Instagram className="h-4 w-4 text-black" />
              </a>
              <a href="https://linkedin.com" className="bg-white rounded-full p-2" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4 text-black" />
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <h2 className="text-3xl font-bold">
                JUSTCLOTHING.
                <br />
                STORE
              </h2>
            </div>
            <div className="text-right">
              <h2 className="text-6xl font-bold mb-2">LET'S TALK!</h2>
              <p className="text-sm">contact@justclothing.store</p>
              <p className="text-sm">+88 01714206969</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <h3 className="text-xl font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:underline">About us</a></li>
                <li><a href="/services" className="hover:underline">Our services</a></li>
                <li><a href="/policies" className="hover:underline">Policies & guidelines</a></li>
                <li><a href="/legal" className="hover:underline">Legal</a></li>
                <li><a href="/blog" className="hover:underline">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Get Help</h3>
              <ul className="space-y-2">
                <li><a href="/faq" className="hover:underline">FAQ</a></li>
                <li><a href="/order-status" className="hover:underline">Order status</a></li>
                <li><a href="/tutorials" className="hover:underline">Tutorials</a></li>
                <li><a href="/payment-options" className="hover:underline">Payment Options</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Socials</h3>
              <ul className="space-y-2">
                <li><a href="https://instagram.com" className="hover:underline">Instagram</a></li>
                <li><a href="https://facebook.com" className="hover:underline">Facebook</a></li>
                <li><a href="https://linkedin.com" className="hover:underline">Linkedin</a></li>
                <li><a href="https://tiktok.com" className="hover:underline">Tiktok</a></li>
                <li><a href="mailto:contact@justclothing.store" className="hover:underline">Email</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400">JUSTCLOTHING.STORE {currentYear} All Rights Reserved©</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="https://facebook.com" className="bg-white rounded-full p-2" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-black" />
              </a>
              <a href="https://instagram.com" className="bg-white rounded-full p-2" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-black" />
              </a>
              <a href="https://linkedin.com" className="bg-white rounded-full p-2" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5 text-black" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
